import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql, query } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const rows = await query('SELECT id, email, display_name, collector_number, rank, total_points, rank_points, collection_count, verified_collector, is_admin, avatar_url FROM users WHERE id = $1', [payload.id]);
  const user = rows[0] || null;

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
