import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { RARITY_POINTS, RANK_THRESHOLDS } from '@/lib/types';

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { card_code } = await req.json();

    if (!card_code) {
      return NextResponse.json({ error: 'Card code required' }, { status: 400 });
    }

    const db = getDb();

    // Find card
    const card = db.prepare('SELECT * FROM cards WHERE card_code = ?').get(card_code) as any;

    if (!card) {
      return NextResponse.json({ error: 'Card not found. Invalid QR code.' }, { status: 404 });
    }

    if (card.owner_id) {
      return NextResponse.json({ error: 'Card already owned by another collector' }, { status: 409 });
    }

    // Check if user already scanned this card
    const existing = db.prepare('SELECT id FROM cards WHERE card_code = ? AND owner_id = ?').get(card_code, payload.id);
    if (existing) {
      return NextResponse.json({ error: 'Card already in your vault' }, { status: 409 });
    }

    // Assign card to user
    db.prepare(`
      UPDATE cards SET owner_id = ?, status = 'active', scanned_at = datetime('now')
      WHERE id = ?
    `).run(payload.id, card.id);

    // Calculate points
    const points = card.rarity ? (RARITY_POINTS[card.rarity as keyof typeof RARITY_POINTS] || card.points_value) : card.points_value;

    // Add points transaction
    db.prepare(`
      INSERT INTO points_transactions (id, user_id, amount, reason, reference_id)
      VALUES (?, ?, ?, 'card_scan', ?)
    `).run(uuidv4(), payload.id, points, card.id);

    // Update user points and check rank
    db.prepare(`
      UPDATE users SET
        total_points = total_points + ?,
        collection_count = collection_count + 1,
        rank_points = rank_points + ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(points, points, payload.id);

    // Check rank progression
    const user = db.prepare('SELECT total_points, rank FROM users WHERE id = ?').get(payload.id) as any;
    const newRank = getRankForPoints(user.total_points);
    if (newRank !== user.rank) {
      db.prepare('UPDATE users SET rank = ? WHERE id = ?').run(newRank, payload.id);
    }

    // Update journey progress
    updateJourneys(db, payload.id, card_code);

    // Get updated card
    const updatedCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(card.id);

    return NextResponse.json({
      card: updatedCard,
      points_earned: points,
      new_total_points: user.total_points + points,
    });
  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Scan processing failed' }, { status: 500 });
  }
}

function getRankForPoints(points: number): string {
  if (points >= RANK_THRESHOLDS.master) return 'master';
  if (points >= RANK_THRESHOLDS.platinum) return 'platinum';
  if (points >= RANK_THRESHOLDS.gold) return 'gold';
  if (points >= RANK_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function updateJourneys(db: any, userId: string, cardCode: string) {
  const journeys = db.prepare('SELECT * FROM collection_journeys').all() as any[];

  for (const journey of journeys) {
    const required: string[] = JSON.parse(journey.required_items || '[]');
    if (!required.includes(cardCode)) continue;

    // Get or create user journey
    let userJourney = db.prepare(
      'SELECT * FROM user_journeys WHERE user_id = ? AND journey_id = ?'
    ).get(userId, journey.id) as any;

    if (!userJourney) {
      db.prepare(`
        INSERT INTO user_journeys (id, user_id, journey_id, progress)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), userId, journey.id, '{}');
      userJourney = db.prepare(
        'SELECT * FROM user_journeys WHERE user_id = ? AND journey_id = ?'
      ).get(userId, journey.id);
    }

    const progress = JSON.parse(userJourney.progress || '{}');
    progress[cardCode] = true;
    const collected = Object.keys(progress).length;

    db.prepare('UPDATE user_journeys SET progress = ? WHERE id = ?')
      .run(JSON.stringify(progress), userJourney.id);

    // Check completion
    if (collected >= required.length && !userJourney.completed) {
      db.prepare(`
        UPDATE user_journeys SET completed = 1, completed_at = datetime('now')
        WHERE id = ?
      `).run(userJourney.id);

      // Award journey points
      db.prepare(`
        INSERT INTO points_transactions (id, user_id, amount, reason, reference_id)
        VALUES (?, ?, ?, 'journey_complete', ?)
      `).run(uuidv4(), userId, journey.reward_points, journey.id);

      db.prepare(`
        UPDATE users SET total_points = total_points + ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(journey.reward_points, userId);
    }
  }
}
