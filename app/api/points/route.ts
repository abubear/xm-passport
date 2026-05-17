import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const transactions = db.prepare(
      'SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(payload.id);

    const user = db.prepare('SELECT total_points, rank, rank_points FROM users WHERE id = ?').get(payload.id);

    return NextResponse.json({ transactions, points: user });
  } catch (err) {
    console.error('Points error:', err);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}
