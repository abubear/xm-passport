import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql, query } from '@/lib/db';
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

    // Find card
    const cardRows = await query('SELECT * FROM cards WHERE card_code = $1', [card_code]);
    const card = cardRows[0] || null;

    if (!card) {
      return NextResponse.json({ error: 'Card not found. Invalid QR code.' }, { status: 404 });
    }

    if (card.owner_id) {
      return NextResponse.json({ error: 'Card already owned by another collector' }, { status: 409 });
    }

    // Check if user already scanned this card
    const existingRows = await query('SELECT id FROM cards WHERE card_code = $1 AND owner_id = $2', [card_code, payload.id]);
    if (existingRows.length > 0) {
      return NextResponse.json({ error: 'Card already in your vault' }, { status: 409 });
    }

    // Assign card to user
    await query(`
      UPDATE cards SET owner_id = $1, status = 'active', scanned_at = NOW()
      WHERE id = $2
    `, [payload.id, card.id]);

    // Calculate points
    const points = card.rarity ? (RARITY_POINTS[card.rarity as keyof typeof RARITY_POINTS] || card.points_value) : card.points_value;

    // Add points transaction
    await query(`
      INSERT INTO points_transactions (id, user_id, amount, reason, reference_id)
      VALUES ($1, $2, $3, 'card_scan', $4)
    `, [uuidv4(), payload.id, points, card.id]);

    // Update user points and check rank
    await query(`
      UPDATE users SET
        total_points = total_points + $1,
        collection_count = collection_count + 1,
        rank_points = rank_points + $2,
        updated_at = NOW()
      WHERE id = $3
    `, [points, points, payload.id]);

    // Check rank progression
    const userRows = await query('SELECT total_points, rank FROM users WHERE id = $1', [payload.id]);
    const user = userRows[0] || null;
    const newRank = getRankForPoints(user.total_points);
    if (newRank !== user.rank) {
      await query('UPDATE users SET rank = $1 WHERE id = $2', [newRank, payload.id]);
    }

    // Update journey progress
    await updateJourneys(payload.id, card_code);

    // Get updated card
    const updatedCardRows = await query('SELECT * FROM cards WHERE id = $1', [card.id]);
    const updatedCard = updatedCardRows[0] || null;

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

async function updateJourneys(userId: string, cardCode: string) {
  const journeys = await query('SELECT * FROM collection_journeys');

  for (const journey of journeys) {
    const required: string[] = JSON.parse(journey.required_items || '[]');
    if (!required.includes(cardCode)) continue;

    // Get or create user journey
    let userJourneyRows = await query(
      'SELECT * FROM user_journeys WHERE user_id = $1 AND journey_id = $2',
      [userId, journey.id]
    );
    let userJourney = userJourneyRows[0] || null;

    if (!userJourney) {
      await query(`
        INSERT INTO user_journeys (id, user_id, journey_id, progress)
        VALUES ($1, $2, $3, $4)
      `, [uuidv4(), userId, journey.id, '{}']);
      userJourneyRows = await query(
        'SELECT * FROM user_journeys WHERE user_id = $1 AND journey_id = $2',
        [userId, journey.id]
      );
      userJourney = userJourneyRows[0] || null;
    }

    const progress = JSON.parse(userJourney.progress || '{}');
    progress[cardCode] = true;
    const collected = Object.keys(progress).length;

    await query('UPDATE user_journeys SET progress = $1 WHERE id = $2',
      [JSON.stringify(progress), userJourney.id]);

    // Check completion
    if (collected >= required.length && !userJourney.completed) {
      await query(`
        UPDATE user_journeys SET completed = 1, completed_at = NOW()
        WHERE id = $1
      `, [userJourney.id]);

      // Award journey points
      await query(`
        INSERT INTO points_transactions (id, user_id, amount, reason, reference_id)
        VALUES ($1, $2, $3, 'journey_complete', $4)
      `, [uuidv4(), userId, journey.reward_points, journey.id]);

      await query(`
        UPDATE users SET total_points = total_points + $1, updated_at = NOW()
        WHERE id = $2
      `, [journey.reward_points, userId]);
    }
  }
}
