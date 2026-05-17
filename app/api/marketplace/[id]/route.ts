import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';

// PUT - buy listing
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(params.id) as any;

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing no longer available' }, { status: 400 });
    }

    if (listing.seller_id === payload.id) {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });
    }

    // Process purchase - transfer ownership
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE marketplace_listings
      SET status = 'sold', buyer_id = ?, sold_at = ?
      WHERE id = ?
    `).run(payload.id, now, params.id);

    // Transfer item ownership
    if (listing.item_type === 'card') {
      db.prepare('UPDATE cards SET owner_id = ? WHERE id = ?').run(payload.id, listing.item_id);
    } else if (listing.item_type === 'eticket') {
      db.prepare('UPDATE etickets SET owner_id = ? WHERE id = ?').run(payload.id, listing.item_id);
    }

    const updated = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(params.id);

    return NextResponse.json({ listing: updated, message: 'Purchase complete. Item transferred to your vault.' });
  } catch (err) {
    console.error('Buy error:', err);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}

// DELETE - cancel listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(params.id) as any;

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.seller_id !== payload.id) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
    }

    db.prepare("UPDATE marketplace_listings SET status = 'cancelled' WHERE id = ?").run(params.id);

    return NextResponse.json({ message: 'Listing cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }
}
