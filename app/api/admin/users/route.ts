import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql, query } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!payload.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const users = await query('SELECT * FROM users ORDER BY created_at DESC');

  return NextResponse.json({ users });
}
