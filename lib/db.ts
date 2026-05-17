import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'xm-passport.db');

let db: Database.Database;

let migrated = false;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  if (!migrated) {
    migrated = true;
    migrate();
    // Auto-seed if DB is empty
    const cardCount = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
    if (cardCount.count === 0) {
      seed();
    }
  }
  return db;
}

export function migrate() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY);
  `);

  const currentVersion = (db.prepare('SELECT MAX(version) as v FROM _migrations').get() as any)?.v || 0;

  if (currentVersion < 1) {
    db.exec(`
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
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

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
        scanned_at TEXT,
        points_value INTEGER DEFAULT 100,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS etickets (
        id TEXT PRIMARY KEY,
        ticket_code TEXT UNIQUE NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        owner_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'active',
        payment_status TEXT DEFAULT 'reserved',
        purchase_price REAL,
        redemption_date TEXT,
        expiry_date TEXT,
        points_earned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT,
        description TEXT,
        product_type TEXT DEFAULT 'statue',
        edition_size INTEGER,
        price REAL,
        image_url TEXT,
        release_date TEXT,
        status TEXT DEFAULT 'draft',
        e_ticket_enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id TEXT PRIMARY KEY,
        seller_id TEXT REFERENCES users(id),
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'SGD',
        status TEXT DEFAULT 'active',
        buyer_id TEXT REFERENCES users(id),
        sold_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS points_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        reference_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS collection_journeys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        ip TEXT,
        required_items TEXT NOT NULL,
        reward_points INTEGER DEFAULT 500,
        reward_rank_boost INTEGER DEFAULT 0,
        badge_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_journeys (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        journey_id TEXT REFERENCES collection_journeys(id),
        progress TEXT DEFAULT '{}',
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    db.prepare('INSERT INTO _migrations (version) VALUES (1)').run();
  }

  // v2: Add multi-auth fields if missing (for DBs created before v2)
  if (currentVersion < 2) {
    // Add new columns if they don't exist (ignore errors if they do)
    const newCols = [
      "ALTER TABLE users ADD COLUMN phone TEXT",
      "ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email'",
      "ALTER TABLE users ADD COLUMN provider_id TEXT",
      "ALTER TABLE users ADD COLUMN wechat_unionid TEXT",
    ];
    for (const sql of newCols) {
      try { db.exec(sql); } catch (e) { /* column already exists */ }
    }
    // Make email and password_hash nullable (SQLite doesn't support ALTER COLUMN, 
    // but new rows will be created correctly; existing rows have values already)
    db.prepare('INSERT INTO _migrations (version) VALUES (2)').run();
  }

  // v3: Recreate users table with nullable email/password for multi-auth
  // (SQLite can't ALTER COLUMN constraints, must recreate table)
  if (currentVersion < 3) {
    try {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE IF NOT EXISTS users_new (
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
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO users_new SELECT
          id, email, phone, password_hash, display_name,
          COALESCE(auth_provider, 'email') as auth_provider,
          provider_id, wechat_unionid, collector_number, avatar_url,
          total_points, rank, rank_points, collection_count,
          verified_collector, is_admin, created_at, updated_at
        FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
      `);
      db.pragma('foreign_keys = ON');
      console.log('Migration v3: users table recreated with nullable auth fields');
    } catch (e) {
      console.error('Migration v3 failed:', (e as Error).message);
      db.pragma('foreign_keys = ON');
    }
    db.prepare('INSERT INTO _migrations (version) VALUES (3)').run();
  }

  // v4: Collector profile fields
  if (currentVersion < 4) {
    const profileCols = [
      "ALTER TABLE users ADD COLUMN bio TEXT",
      "ALTER TABLE users ADD COLUMN location TEXT",
      "ALTER TABLE users ADD COLUMN collection_prefs TEXT DEFAULT '[]'",
      "ALTER TABLE users ADD COLUMN public_profile INTEGER DEFAULT 0",
      "ALTER TABLE users ADD COLUMN social_links TEXT DEFAULT '{}'",
    ];
    for (const sql of profileCols) {
      try { db.exec(sql); } catch (e) { /* column already exists */ }
    }
    db.prepare('INSERT INTO _migrations (version) VALUES (4)').run();
    console.log('Migration v4: profile fields added');
  }

  // v5: Language preference
  if (currentVersion < 5) {
    try { db.exec("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'"); } catch (e) { /* exists */ }
    db.prepare('INSERT INTO _migrations (version) VALUES (5)').run();
    console.log('Migration v5: language field added');
  }

  console.log('Migration complete. Version:', currentVersion < 1 ? 1 : currentVersion);
}

export function seed() {
  const db = getDb();

  const adminId = uuidv4();
  const hash = bcrypt.hashSync('admin123', 10);

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@xmstudios.com');
  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, collector_number, rank, verified_collector, is_admin, auth_provider)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'email')
    `).run(adminId, 'admin@xmstudios.com', hash, 'XM Admin', 'XM-00000', 'master', 1, 1);
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

  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO cards (id, card_code, product_name, ip, rarity, card_type, edition_size, points_value, status)
    VALUES (?, ?, ?, ?, ?, 'metal', ?, ?, 'active')
  `);

  for (const card of sampleCards) {
    insertCard.run(uuidv4(), card.code, card.name, card.ip, card.rarity, card.rarity === 'legendary' ? 100 : 500, card.points);
  }

  // Seed sample journeys
  const journeyInsert = db.prepare(`
    INSERT OR IGNORE INTO collection_journeys (id, name, description, ip, required_items, reward_points)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  journeyInsert.run(uuidv4(), 'Batman Rogues Gallery', 'Collect all Batman villain metal cards', 'DC Comics', '["XM-CARD-0001","XM-CARD-0007"]', 1000);
  journeyInsert.run(uuidv4(), 'Marvel Legends', 'Collect all Marvel metal cards', 'Marvel', '["XM-CARD-0003","XM-CARD-0004","XM-CARD-0008"]', 1500);
  journeyInsert.run(uuidv4(), 'Dark Knights', 'Collect Batman metal cards', 'DC Comics', '["XM-CARD-0001","XM-CARD-0006"]', 750);

  // Seed sample products
  const productInsert = db.prepare(`
    INSERT OR IGNORE INTO products (id, name, ip, description, product_type, edition_size, price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  productInsert.run(uuidv4(), 'Batman Who Laughs Statue', 'DC Comics', '1/4 Scale Premium Collectible Statue', 'statue', 500, 1599, 'announced');
  productInsert.run(uuidv4(), 'Wonder Woman Golden Armor', 'DC Comics', '1/4 Scale Premium Collectible Statue', 'statue', 300, 1899, 'preorder');
  productInsert.run(uuidv4(), 'Iron Man Mark LXXXV', 'Marvel', '1/4 Scale Premium Collectible Statue', 'statue', 400, 1699, 'announced');

  console.log('Seed complete.');
}

if (require.main === module) {
  const cmd = process.argv[2] || 'migrate';
  if (cmd === 'seed') seed();
  else migrate();
}
