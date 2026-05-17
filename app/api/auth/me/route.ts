import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, email, display_name, collector_number, rank, total_points, rank_points, collection_count, verified_collector, is_admin, avatar_url FROM users WHERE id = ?').get(payload.id) as any;

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
