import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ticket_id } = await req.json();

    const ticketRows = await query('SELECT * FROM etickets WHERE id = $1 AND owner_id = $2', [ticket_id, payload.id]);
    const ticket = ticketRows[0] || null;

    if (!ticket) {
      return NextResponse.json({ error: 'E-ticket not found' }, { status: 404 });
    }

    if (ticket.status !== 'active') {
      return NextResponse.json({ error: `Ticket is ${ticket.status}` }, { status: 400 });
    }

    if (ticket.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment required before redemption' }, { status: 400 });
    }

    await sql(`
      UPDATE etickets SET status = 'redeemed', redemption_date = NOW()
      WHERE id = $1
    `, [ticket_id]);

    const updatedRows = await query('SELECT * FROM etickets WHERE id = $1', [ticket_id]);
    const updated = updatedRows[0] || null;

    return NextResponse.json({ ticket: updated, message: 'E-ticket redeemed successfully' });
  } catch (err) {
    console.error('Redeem error:', err);
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
  }
}
