import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET — fetch current user profile
export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, email, phone, display_name, collector_number, avatar_url,
             bio, location, collection_prefs, public_profile, social_links, language,
             rank, total_points, rank_points, collection_count, verified_collector,
             auth_provider, created_at
      FROM users WHERE id = ?
    `).get(payload.id);

    const cards = db.prepare('SELECT COUNT(*) as count FROM cards WHERE owner_id = ?').get(payload.id) as { count: number };
    const etickets = db.prepare('SELECT COUNT(*) as count FROM etickets WHERE owner_id = ?').get(payload.id) as { count: number };

    return NextResponse.json({ user, stats: { cards: cards.count, etickets: etickets.count } });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT — update profile
export async function PUT(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { display_name, bio, location, collection_prefs, public_profile, social_links, avatar_url } = body;

    if (display_name !== undefined && (!display_name || display_name.trim().length === 0)) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 });
    }

    if (display_name && display_name.length > 50) {
      return NextResponse.json({ error: 'Display name must be under 50 characters' }, { status: 400 });
    }

    if (bio && bio.length > 300) {
      return NextResponse.json({ error: 'Bio must be under 300 characters' }, { status: 400 });
    }

    const db = getDb();

    db.prepare(`
      UPDATE users SET
        display_name = COALESCE(NULLIF(?, ''), display_name),
        bio = COALESCE(?, bio),
        location = COALESCE(?, location),
        collection_prefs = COALESCE(?, collection_prefs),
        public_profile = COALESCE(?, public_profile),
        social_links = COALESCE(?, social_links),
        language = COALESCE(?, language),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      display_name?.trim() || null,
      bio !== undefined ? bio : null,
      location !== undefined ? location : null,
      collection_prefs !== undefined ? collection_prefs : null,
      public_profile !== undefined ? public_profile : null,
      social_links !== undefined ? social_links : null,
      language !== undefined ? language : null,
      avatar_url !== undefined ? avatar_url : null,
      payload.id
    );

    const updated = db.prepare(`
      SELECT id, email, phone, display_name, collector_number, avatar_url,
             bio, location, collection_prefs, public_profile, social_links,
             rank, total_points
      FROM users WHERE id = ?
    `).get(payload.id);

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
