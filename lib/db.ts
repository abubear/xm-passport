import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const connectionString = process.env.POSTGRES_URL!;
const _sql = neon(connectionString);

// Neon returns a tagged-template function.
// Template literal: await sql`SELECT * FROM users WHERE id = ${id}`
// Function call (runtime): await sql('SELECT ... WHERE id = $1', [id])
// Types only support template literals, so export both:
export const sql = _sql;

/** Typed wrapper for parameterized queries: await query('SELECT * FROM users WHERE id = $1', [id]) */
export async function query(text: string, params?: any[]) {
  return (_sql as any)(text, params);
}

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;
  await migrate();
  const rows = await sql`SELECT COUNT(*) as count FROM cards`;
  if (rows[0]?.count === 0 || rows[0]?.count === BigInt(0)) {
    await seed();
  }
}

export async function migrate() {
  // Migrations
  await sql`CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)`;

  const versionRows = await sql`SELECT COALESCE(MAX(version), 0) as v FROM _migrations`;
  const currentVersion = Number(versionRows[0]?.v || 0);

  if (currentVersion < 1) {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        display_name TEXT NOT NULL,
        auth_provider TEXT DEFAULT 'email',
        provider_id TEXT,
        wechat_unionid TEXT,
        collector_number TEXT,
        avatar_url TEXT,
        total_points INTEGER DEFAULT 0,
        rank TEXT DEFAULT 'bronze',
        rank_points INTEGER DEFAULT 0,
        collection_count INTEGER DEFAULT 0,
        verified_collector INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        card_code TEXT UNIQUE NOT NULL,
        product_name TEXT NOT NULL,
        ip TEXT,
        edition TEXT,
        edition_size INTEGER,
        edition_number INTEGER,
        rarity TEXT DEFAULT 'common',
        card_type TEXT DEFAULT 'metal',
        image_url TEXT,
        owner_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'active',
        scanned_at TIMESTAMP,
        points_value INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS etickets (
        id TEXT PRIMARY KEY,
        ticket_code TEXT UNIQUE NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        owner_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'active',
        payment_status TEXT DEFAULT 'reserved',
        purchase_price REAL,
        redemption_date TIMESTAMP,
        expiry_date TIMESTAMP,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT,
        description TEXT,
        product_type TEXT DEFAULT 'statue',
        edition_size INTEGER,
        price REAL,
        image_url TEXT,
        release_date TIMESTAMP,
        status TEXT DEFAULT 'draft',
        e_ticket_enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id TEXT PRIMARY KEY,
        seller_id TEXT REFERENCES users(id),
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'SGD',
        status TEXT DEFAULT 'active',
        buyer_id TEXT REFERENCES users(id),
        sold_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS points_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        reference_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS collection_journeys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        ip TEXT,
        required_items TEXT NOT NULL,
        reward_points INTEGER DEFAULT 500,
        reward_rank_boost INTEGER DEFAULT 0,
        badge_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_journeys (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        journey_id TEXT REFERENCES collection_journeys(id),
        progress TEXT DEFAULT '{}',
        completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`INSERT INTO _migrations (version) VALUES (1)`;
  }

  if (currentVersion < 2) {
    // Add columns if missing (Postgres ignores IF NOT EXISTS for ALTER TABLE)
    const cols = ['phone', 'auth_provider', 'provider_id', 'wechat_unionid'];
    for (const col of cols) {
      try {
        if (col === 'phone') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
        else if (col === 'auth_provider') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email'`;
        else if (col === 'provider_id') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT`;
        else if (col === 'wechat_unionid') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid TEXT`;
      } catch (e) { /* column exists */ }
    }
    await sql`INSERT INTO _migrations (version) VALUES (2)`;
  }

  if (currentVersion < 3) {
    // Postgres handles nullable columns by default - no rebuild needed
    await sql`INSERT INTO _migrations (version) VALUES (3)`;
  }

  if (currentVersion < 4) {
    const profileCols = ['bio', 'location', 'collection_prefs', 'public_profile', 'social_links'];
    for (const col of profileCols) {
      try {
        if (col === 'bio') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
        else if (col === 'location') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT`;
        else if (col === 'collection_prefs') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS collection_prefs TEXT DEFAULT '[]'`;
        else if (col === 'public_profile') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_profile INTEGER DEFAULT 0`;
        else if (col === 'social_links') await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links TEXT DEFAULT '{}'`;
      } catch (e) { /* exists */ }
    }
    await sql`INSERT INTO _migrations (version) VALUES (4)`;
  }

  if (currentVersion < 5) {
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'`;
    } catch (e) { /* exists */ }
    await sql`INSERT INTO _migrations (version) VALUES (5)`;
  }

  console.log('Migration complete. Version:', currentVersion < 1 ? 1 : currentVersion);
}

export async function seed() {
  const hash = bcrypt.hashSync('admin123', 10);

  // CONCEPT MODE: seed demo user
  const demoId = '00000000-0000-0000-0000-000000000001';
  const demoExists = await sql`SELECT id FROM users WHERE id = ${demoId}`;
  if (demoExists.length === 0) {
    await sql`
      INSERT INTO users (id, email, display_name, collector_number, rank, total_points, rank_points, collection_count, verified_collector, is_admin, auth_provider)
      VALUES (${demoId}, 'demo@xmstudios.com', 'Demo Collector', 'XM-DEMO01', 'bronze', 0, 0, 0, 0, 0, 'email')
    `;
  }

  const existing = await sql`SELECT id FROM users WHERE email = 'admin@xmstudios.com'`;
  if (existing.length === 0) {
    await sql`
      INSERT INTO users (id, email, password_hash, display_name, collector_number, rank, verified_collector, is_admin, auth_provider)
      VALUES (${uuidv4()}, 'admin@xmstudios.com', ${hash}, 'XM Admin', 'XM-00000', 'master', 1, 1, 'email')
    `;
    console.log('Admin user created: admin@xmstudios.com / admin123');
  }

  // Seed sample cards
  const sampleCards = [
    { code: 'XM-CARD-0001', name: 'Batman Who Laughs', ip: 'DC Comics', rarity: 'legendary', points: 500 },
    { code: 'XM-CARD-0002', name: 'Wonder Woman Golden Armor', ip: 'DC Comics', rarity: 'ultra-rare', points: 400 },
    { code: 'XM-CARD-0003', name: 'Iron Man Mark LXXXV', ip: 'Marvel', rarity: 'rare', points: 300 },
    { code: 'XM-CARD-0004', name: 'Venom Symbiote', ip: 'Marvel', rarity: 'rare', points: 300 },
    { code: 'XM-CARD-0005', name: 'Optimus Prime', ip: 'Transformers', rarity: 'ultra-rare', points: 400 },
    { code: 'XM-CARD-0006', name: 'Batman Dark Knight', ip: 'DC Comics', rarity: 'common', points: 100 },
    { code: 'XM-CARD-0007', name: 'Joker Chaos', ip: 'DC Comics', rarity: 'rare', points: 300 },
    { code: 'XM-CARD-0008', name: 'Spider-Man Classic', ip: 'Marvel', rarity: 'common', points: 100 },
  ];

  for (const card of sampleCards) {
    try {
      await sql`
        INSERT INTO cards (id, card_code, product_name, ip, rarity, card_type, edition_size, points_value, status, owner_id, scanned_at)
        VALUES (${uuidv4()}, ${card.code}, ${card.name}, ${card.ip}, ${card.rarity}, 'metal', ${card.rarity === 'legendary' ? 100 : 500}, ${card.points}, 'active', ${demoId}, NOW())
      `;
    } catch (e) { /* ignore duplicate */ }
  }

  // Give demo user some points
  const demoPoints = await sql`SELECT total_points FROM users WHERE id = ${demoId}`;
  if (demoPoints.length > 0 && Number(demoPoints[0].total_points) === 0) {
    await sql`UPDATE users SET total_points = 1250, rank_points = 1250, rank = 'silver', collection_count = 8 WHERE id = ${demoId}`;
  }

  // Seed sample journeys
  const journeys = [
    { name: 'Batman Rogues Gallery', desc: 'Collect all Batman villain metal cards', ip: 'DC Comics', items: '["XM-CARD-0001","XM-CARD-0007"]', points: 1000 },
    { name: 'Marvel Legends', desc: 'Collect all Marvel metal cards', ip: 'Marvel', items: '["XM-CARD-0003","XM-CARD-0004","XM-CARD-0008"]', points: 1500 },
    { name: 'Dark Knights', desc: 'Collect Batman metal cards', ip: 'DC Comics', items: '["XM-CARD-0001","XM-CARD-0006"]', points: 750 },
  ];

  for (const j of journeys) {
    try {
      await sql`
        INSERT INTO collection_journeys (id, name, description, ip, required_items, reward_points)
        VALUES (${uuidv4()}, ${j.name}, ${j.desc}, ${j.ip}, ${j.items}, ${j.points})
      `;
    } catch (e) { /* ignore duplicate */ }
  }

  // Seed sample products
  const products = [
    { name: 'Batman Who Laughs Statue', ip: 'DC Comics', desc: '1/4 Scale Premium Collectible Statue', type: 'statue', size: 500, price: 1599, status: 'announced' },
    { name: 'Wonder Woman Golden Armor', ip: 'DC Comics', desc: '1/4 Scale Premium Collectible Statue', type: 'statue', size: 300, price: 1899, status: 'preorder' },
    { name: 'Iron Man Mark LXXXV', ip: 'Marvel', desc: '1/4 Scale Premium Collectible Statue', type: 'statue', size: 400, price: 1699, status: 'announced' },
  ];

  for (const p of products) {
    try {
      await sql`
        INSERT INTO products (id, name, ip, description, product_type, edition_size, price, status)
        VALUES (${uuidv4()}, ${p.name}, ${p.ip}, ${p.desc}, ${p.type}, ${p.size}, ${p.price}, ${p.status})
      `;
    } catch (e) { /* ignore duplicate */ }
  }

  console.log('Seed complete.');
}
