import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - list marketplace listings
export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const listings = db.prepare(`
      SELECT ml.*, u.display_name as seller_name, u.collector_number as seller_number
      FROM marketplace_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.status = 'active'
      ORDER BY ml.created_at DESC
      LIMIT 50
    `).all();

    return NextResponse.json({ listings });
  } catch (err) {
    console.error('Marketplace GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST - create listing
export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { item_type, item_id, price } = await req.json();

    if (!item_type || !item_id || !price) {
      return NextResponse.json({ error: 'item_type, item_id, price required' }, { status: 400 });
    }

    if (!['card', 'eticket', 'collectible'].includes(item_type)) {
      return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 });
    }

    const db = getDb();

    // Verify ownership
    let item;
    if (item_type === 'card') {
      item = db.prepare('SELECT * FROM cards WHERE id = ? AND owner_id = ?').get(item_id, payload.id);
    } else if (item_type === 'eticket') {
      item = db.prepare('SELECT * FROM etickets WHERE id = ? AND owner_id = ?').get(item_id, payload.id);
    }

    if (!item) {
      return NextResponse.json({ error: 'Item not found or not owned by you' }, { status: 403 });
    }

    // Check for existing active listing
    const existing = db.prepare(
      'SELECT id FROM marketplace_listings WHERE item_id = ? AND seller_id = ? AND status = ?'
    ).get(item_id, payload.id, 'active');

    if (existing) {
      return NextResponse.json({ error: 'Item already listed' }, { status: 409 });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO marketplace_listings (id, seller_id, item_type, item_id, price)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, payload.id, item_type, item_id, price);

    const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(id);

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error('Marketplace POST error:', err);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
