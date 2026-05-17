import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - list marketplace listings
export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const listings = await query(`
      SELECT ml.*, u.display_name as seller_name, u.collector_number as seller_number
      FROM marketplace_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.status = 'active'
      ORDER BY ml.created_at DESC
      LIMIT 50
    `);

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

    // Verify ownership
    let item;
    if (item_type === 'card') {
      const rows = await query('SELECT * FROM cards WHERE id = $1 AND owner_id = $2', [item_id, payload.id]);
      item = rows[0] || null;
    } else if (item_type === 'eticket') {
      const rows = await query('SELECT * FROM etickets WHERE id = $1 AND owner_id = $2', [item_id, payload.id]);
      item = rows[0] || null;
    }

    if (!item) {
      return NextResponse.json({ error: 'Item not found or not owned by you' }, { status: 403 });
    }

    // Check for existing active listing
    const existingRows = await query(
      'SELECT id FROM marketplace_listings WHERE item_id = $1 AND seller_id = $2 AND status = $3',
      [item_id, payload.id, 'active']
    );
    const existing = existingRows[0] || null;

    if (existing) {
      return NextResponse.json({ error: 'Item already listed' }, { status: 409 });
    }

    const id = uuidv4();
    await query(
      'INSERT INTO marketplace_listings (id, seller_id, item_type, item_id, price) VALUES ($1, $2, $3, $4, $5)',
      [id, payload.id, item_type, item_id, price]
    );

    const listingRows = await query('SELECT * FROM marketplace_listings WHERE id = $1', [id]);
    const listing = listingRows[0] || null;

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error('Marketplace POST error:', err);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
