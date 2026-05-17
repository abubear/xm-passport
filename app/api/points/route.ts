import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await query(
      'SELECT * FROM points_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [payload.id]
    );

    const userRows = await query('SELECT total_points, rank, rank_points FROM users WHERE id = $1', [payload.id]);
    const user = userRows[0] || null;

    return NextResponse.json({ transactions, points: user });
  } catch (err) {
    console.error('Points error:', err);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}
