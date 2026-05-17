import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ status: 'ok', message: 'Database initialized and seeded' });
  } catch (err: any) {
    console.error('Setup error:', err);
    return NextResponse.json({ status: 'error', message: err?.message || String(err) }, { status: 500 });
  }
}
