import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const etickets = db.prepare(
      'SELECT * FROM etickets WHERE owner_id = ? ORDER BY created_at DESC'
    ).all(payload.id);

    return NextResponse.json({ etickets });
  } catch (err) {
    console.error('ETickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch e-tickets' }, { status: 500 });
  }
}
