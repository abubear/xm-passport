import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

let migrated = false;

export async function query(text: string, params?: any[]) {
  if (!migrated) {
    migrated = true;
    await migrate();
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function initDb() {
  await migrate();
  const rows = await query('SELECT COUNT(*) as count FROM cards');
  if (Number(rows[0]?.count || 0) === 0) {
    await seed();
  }
}

export async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)');

  const versionResult = await pool.query('SELECT COALESCE(MAX(version), 0) as v FROM _migrations');
  const currentVersion = Number(versionResult.rows[0]?.v || 0);

  if (currentVersion < 1) {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT UNIQUE, password_hash TEXT,
      display_name TEXT NOT NULL, auth_provider TEXT DEFAULT 'email', provider_id TEXT,
      wechat_unionid TEXT, collector_number TEXT, avatar_url TEXT,
      total_points INTEGER DEFAULT 0, rank TEXT DEFAULT 'bronze', rank_points INTEGER DEFAULT 0,
      collection_count INTEGER DEFAULT 0, verified_collector INTEGER DEFAULT 0, is_admin INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY, card_code TEXT UNIQUE NOT NULL, product_name TEXT NOT NULL,
      ip TEXT, edition TEXT, edition_size INTEGER, edition_number INTEGER,
      rarity TEXT DEFAULT 'common', card_type TEXT DEFAULT 'metal', image_url TEXT,
      owner_id TEXT REFERENCES users(id), status TEXT DEFAULT 'active', scanned_at TIMESTAMP,
      points_value INTEGER DEFAULT 100, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS etickets (
      id TEXT PRIMARY KEY, ticket_code TEXT UNIQUE NOT NULL, product_id TEXT NOT NULL,
      product_name TEXT NOT NULL, owner_id TEXT REFERENCES users(id), status TEXT DEFAULT 'active',
      payment_status TEXT DEFAULT 'reserved', purchase_price REAL, redemption_date TIMESTAMP,
      expiry_date TIMESTAMP, points_earned INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, ip TEXT, description TEXT,
      product_type TEXT DEFAULT 'statue', edition_size INTEGER, price REAL,
      image_url TEXT, release_date TIMESTAMP, status TEXT DEFAULT 'draft',
      e_ticket_enabled INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY, seller_id TEXT REFERENCES users(id), item_type TEXT NOT NULL,
      item_id TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'SGD',
      status TEXT DEFAULT 'active', buyer_id TEXT REFERENCES users(id),
      sold_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS points_transactions (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), amount INTEGER NOT NULL,
      reason TEXT NOT NULL, reference_id TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS collection_journeys (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, ip TEXT,
      required_items TEXT NOT NULL, reward_points INTEGER DEFAULT 500,
      reward_rank_boost INTEGER DEFAULT 0, badge_url TEXT, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS user_journeys (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
      journey_id TEXT REFERENCES collection_journeys(id),
      progress TEXT DEFAULT '{}', completed INTEGER DEFAULT 0,
      completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query('INSERT INTO _migrations (version) VALUES (1)');
  }

  if (currentVersion < 2) {
    const cols = ['phone', 'auth_provider', 'provider_id', 'wechat_unionid'];
    for (const col of cols) {
      try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} TEXT`); }
      catch { /* exists */ }
    }
    await pool.query('INSERT INTO _migrations (version) VALUES (2)');
  }

  if (currentVersion < 3) {
    await pool.query('INSERT INTO _migrations (version) VALUES (3)');
  }

  if (currentVersion < 4) {
    const cols = ['bio', 'location', 'collection_prefs', 'public_profile', 'social_links'];
    for (const col of cols) {
      try {
        const defaults: Record<string, string> = {
          collection_prefs: "TEXT DEFAULT '[]'",
          public_profile: 'INTEGER DEFAULT 0',
          social_links: "TEXT DEFAULT '{}'",
        };
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} ${defaults[col] || 'TEXT'}`);
      } catch { /* exists */ }
    }
    await pool.query('INSERT INTO _migrations (version) VALUES (4)');
  }

  if (currentVersion < 5) {
    try { await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'"); }
    catch { /* exists */ }
    await pool.query('INSERT INTO _migrations (version) VALUES (5)');
  }

  console.log('Migration complete. Version:', currentVersion < 1 ? 1 : currentVersion);
}

export async function seed() {
  const demoId = '00000000-0000-0000-0000-000000000001';

  // Demo user
  const demoCheck = await pool.query('SELECT id FROM users WHERE id = $1', [demoId]);
  if (demoCheck.rows.length === 0) {
    await pool.query(`INSERT INTO users (id, email, display_name, collector_number, rank, total_points, rank_points, collection_count, verified_collector, is_admin, auth_provider) VALUES ($1, 'demo@xmstudios.com', 'Demo Collector', 'XM-DEMO01', 'gold', 2900, 2900, 25, 0, 0, 'email')`, [demoId]);
  }

  // Admin user
  const hash = bcrypt.hashSync('admin123', 10);
  const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@xmstudios.com'");
  if (adminCheck.rows.length === 0) {
    await pool.query(`INSERT INTO users (id, email, password_hash, display_name, collector_number, rank, verified_collector, is_admin, auth_provider) VALUES ($1, 'admin@xmstudios.com', $2, 'XM Admin', 'XM-00000', 'master', 1, 1, 'email')`, [uuidv4(), hash]);
  }

  // Cards (25)
  const sampleCards = [
    ['XM-CARD-0001', 'Batman Who Laughs', 'DC Comics', 'legendary', 500],
    ['XM-CARD-0002', 'Wonder Woman Golden Armor', 'DC Comics', 'ultra-rare', 400],
    ['XM-CARD-0003', 'Iron Man Mark LXXXV', 'Marvel', 'rare', 300],
    ['XM-CARD-0004', 'Venom Symbiote', 'Marvel', 'rare', 300],
    ['XM-CARD-0005', 'Optimus Prime', 'Transformers', 'ultra-rare', 400],
    ['XM-CARD-0006', 'Batman Dark Knight', 'DC Comics', 'common', 100],
    ['XM-CARD-0007', 'Joker Chaos', 'DC Comics', 'rare', 300],
    ['XM-CARD-0008', 'Spider-Man Classic', 'Marvel', 'common', 100],
    ['XM-CARD-0009', 'Thor Odinson', 'Marvel', 'ultra-rare', 400],
    ['XM-CARD-0010', 'Darkseid', 'DC Comics', 'legendary', 500],
    ['XM-CARD-0011', 'Captain America Shield', 'Marvel', 'rare', 300],
    ['XM-CARD-0012', 'Hulk Smash', 'Marvel', 'ultra-rare', 400],
    ['XM-CARD-0013', 'Harley Quinn', 'DC Comics', 'rare', 300],
    ['XM-CARD-0014', 'Black Panther', 'Marvel', 'common', 100],
    ['XM-CARD-0015', 'Miles Morales', 'Marvel', 'common', 100],
    ['XM-CARD-0016', 'Superman Red Son', 'DC Comics', 'legendary', 500],
    ['XM-CARD-0017', 'Doctor Strange', 'Marvel', 'rare', 300],
    ['XM-CARD-0018', 'Scarlet Witch', 'Marvel', 'ultra-rare', 400],
    ['XM-CARD-0019', 'The Flash', 'DC Comics', 'common', 100],
    ['XM-CARD-0020', 'Mega Man', 'Capcom', 'rare', 300],
    ['XM-CARD-0021', 'Dante DMC5', 'Capcom', 'ultra-rare', 400],
    ['XM-CARD-0022', 'Guts Berserker', 'Berserk', 'legendary', 500],
    ['XM-CARD-0023', 'Gandalf the Grey', 'Lord of the Rings', 'rare', 300],
    ['XM-CARD-0024', 'Aragorn', 'Lord of the Rings', 'ultra-rare', 400],
    ['XM-CARD-0025', 'He-Man', 'Masters of the Universe', 'common', 100],
  ];

  for (const [code, name, ip, rarity, points] of sampleCards) {
    try {
      await pool.query('INSERT INTO cards (id, card_code, product_name, ip, rarity, card_type, edition_size, points_value, status, owner_id, scanned_at) VALUES ($1, $2, $3, $4, $5, \'metal\', $6, $7, \'active\', $8, NOW()) ON CONFLICT (card_code) DO NOTHING',
        [uuidv4(), code, name, ip, rarity, rarity === 'legendary' ? 100 : 500, points, demoId]);
    } catch { /* ignore */ }
  }

  // E-tickets
  const eticketNames = ['Batman Who Laughs Statue', 'Wonder Woman Golden Armor', 'Iron Man Mark LXXXV', 'Darkseid Throne', 'Optimus Prime Truck Mode', 'Thor Stormbreaker'];
  for (let i = 0; i < 6; i++) {
    try {
      await pool.query('INSERT INTO etickets (id, ticket_code, product_id, product_name, owner_id, status, payment_status, purchase_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (ticket_code) DO NOTHING',
        [uuidv4(), `XM-ET-${String(i+1).padStart(4,'0')}`, uuidv4(), eticketNames[i], demoId, i < 3 ? 'redeemed' : 'active', i < 3 ? 'paid' : 'pending', Math.floor(Math.random() * 1000) + 500]);
    } catch { /* ignore */ }
  }

  // Marketplace listings
  const listingItems = [
    { item: 'XM-CARD-0003', type: 'card', price: 249 },
    { item: 'XM-CARD-0006', type: 'card', price: 89 },
    { item: 'XM-CARD-0008', type: 'card', price: 79 },
    { item: 'XM-ET-0004', type: 'eticket', price: 1599 },
  ];
  for (const l of listingItems) {
    try {
      const exists = await pool.query('SELECT id FROM marketplace_listings WHERE item_id = $1', [l.item]);
      if (exists.rows.length === 0) {
        await pool.query('INSERT INTO marketplace_listings (id, seller_id, item_type, item_id, price, status) VALUES ($1, $2, $3, $4, $5, \'active\')',
          [uuidv4(), demoId, l.type, l.item, l.price]);
      }
    } catch { /* ignore */ }
  }

  // Points transactions
  const reasons = ['card_scan', 'card_scan', 'card_scan', 'journey_complete', 'card_scan', 'card_scan', 'card_scan', 'bonus'];
  const amounts = [300, 400, 100, 1000, 500, 300, 100, 200];
  for (let i = 0; i < 8; i++) {
    try {
      await pool.query(`INSERT INTO points_transactions (id, user_id, amount, reason, created_at) VALUES ($1, $2, $3, $4, NOW() - interval '${(8-i)*2} days') ON CONFLICT DO NOTHING`,
        [uuidv4(), demoId, amounts[i], reasons[i]]);
    } catch { /* ignore */ }
  }

  // Journeys
  const journeys = [
    ['Batman Rogues Gallery', 'Collect all Batman villain metal cards', 'DC Comics', '["XM-CARD-0001","XM-CARD-0007"]', 1000],
    ['Marvel Legends', 'Collect all Marvel metal cards', 'Marvel', '["XM-CARD-0003","XM-CARD-0004","XM-CARD-0008"]', 1500],
    ['Dark Knights', 'Collect Batman metal cards', 'DC Comics', '["XM-CARD-0001","XM-CARD-0006"]', 750],
  ];
  for (const [name, desc, ip, items, points] of journeys) {
    try {
      await pool.query('INSERT INTO collection_journeys (id, name, description, ip, required_items, reward_points) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [uuidv4(), name, desc, ip, items, points]);
    } catch { /* ignore */ }
  }

  // Products
  const products = [
    ['Batman Who Laughs Statue', 'DC Comics', '1/4 Scale Premium Collectible Statue', 'statue', 500, 1599, 'announced'],
    ['Wonder Woman Golden Armor', 'DC Comics', '1/4 Scale Premium Collectible Statue', 'statue', 300, 1899, 'preorder'],
    ['Iron Man Mark LXXXV', 'Marvel', '1/4 Scale Premium Collectible Statue', 'statue', 400, 1699, 'announced'],
  ];
  for (const [name, ip, desc, type, size, price, status] of products) {
    try {
      await pool.query('INSERT INTO products (id, name, ip, description, product_type, edition_size, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
        [uuidv4(), name, ip, desc, type, size, price, status]);
    } catch { /* ignore */ }
  }

  console.log('Seed complete.');
}
