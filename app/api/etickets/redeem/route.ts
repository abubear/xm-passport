import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ticket_id } = await req.json();
    const db = getDb();

    const ticket = db.prepare('SELECT * FROM etickets WHERE id = ? AND owner_id = ?').get(ticket_id, payload.id) as any;

    if (!ticket) {
      return NextResponse.json({ error: 'E-ticket not found' }, { status: 404 });
    }

    if (ticket.status !== 'active') {
      return NextResponse.json({ error: `Ticket is ${ticket.status}` }, { status: 400 });
    }

    if (ticket.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment required before redemption' }, { status: 400 });
    }

    db.prepare(`
      UPDATE etickets SET status = 'redeemed', redemption_date = datetime('now')
      WHERE id = ?
    `).run(ticket_id);

    const updated = db.prepare('SELECT * FROM etickets WHERE id = ?').get(ticket_id);

    return NextResponse.json({ ticket: updated, message: 'E-ticket redeemed successfully' });
  } catch (err) {
    console.error('Redeem error:', err);
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
  }
}
