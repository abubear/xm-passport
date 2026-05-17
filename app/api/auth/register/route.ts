import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, display_name, auth_provider, provider_id, wechat_unionid } = body;

    if (!display_name) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 });
    }

    const db = getDb();
    const provider = auth_provider || 'email';

    // --- Email signup ---
    if (provider === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const id = uuidv4();
      const passwordHash = await hashPassword(password);
      const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const collectorNumber = `XM-${String(count.count + 1).padStart(5, '0')}`;

      db.prepare(`
        INSERT INTO users (id, email, password_hash, display_name, collector_number, auth_provider, rank)
        VALUES (?, ?, ?, ?, ?, 'email', 'bronze')
      `).run(id, email, passwordHash, display_name, collectorNumber);

      const token = signToken({ id, email, phone: null, display_name, rank: 'bronze', is_admin: 0, auth_provider: 'email' });
      setAuthCookie(token);

      return NextResponse.json({
        user: { id, email, display_name, collector_number: collectorNumber, rank: 'bronze', total_points: 0 },
      });
    }

    // --- Phone signup ---
    if (provider === 'phone') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }

      const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
      if (existing) {
        return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });
      }

      const id = uuidv4();
      const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const collectorNumber = `XM-${String(count.count + 1).padStart(5, '0')}`;

      db.prepare(`
        INSERT INTO users (id, phone, display_name, collector_number, auth_provider, rank)
        VALUES (?, ?, ?, ?, 'phone', 'bronze')
      `).run(id, phone, display_name, collectorNumber);

      const token = signToken({ id, email: null, phone, display_name, rank: 'bronze', is_admin: 0, auth_provider: 'phone' });
      setAuthCookie(token);

      return NextResponse.json({
        user: { id, phone, display_name, collector_number: collectorNumber, rank: 'bronze', total_points: 0 },
      });
    }

    // --- Social signup (Apple / Google / WeChat) ---
    if (['apple', 'google', 'wechat'].includes(provider)) {
      if (!provider_id) {
        return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
      }

      // Check if already registered with this provider
      const existingByProvider = db.prepare(
        'SELECT id FROM users WHERE auth_provider = ? AND provider_id = ?'
      ).get(provider, provider_id);

      if (existingByProvider) {
        return NextResponse.json({ error: 'Already registered with this account' }, { status: 409 });
      }

      // For WeChat, also check unionid
      if (provider === 'wechat' && wechat_unionid) {
        const existingByUnion = db.prepare('SELECT id FROM users WHERE wechat_unionid = ?').get(wechat_unionid);
        if (existingByUnion) {
          return NextResponse.json({ error: 'WeChat account already linked' }, { status: 409 });
        }
      }

      const id = uuidv4();
      const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const collectorNumber = `XM-${String(count.count + 1).padStart(5, '0')}`;

      // Social signup may also provide email
      const socialEmail = email || null;
      if (socialEmail) {
        const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(socialEmail);
        if (existingEmail) {
          return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }
      }

      db.prepare(`
        INSERT INTO users (id, email, display_name, collector_number, auth_provider, provider_id, wechat_unionid, rank)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'bronze')
      `).run(id, socialEmail, display_name, collectorNumber, provider, provider_id, wechat_unionid || null);

      const token = signToken({ id, email: socialEmail, phone: null, display_name, rank: 'bronze', is_admin: 0, auth_provider: provider });
      setAuthCookie(token);

      return NextResponse.json({
        user: { id, email: socialEmail, display_name, collector_number: collectorNumber, rank: 'bronze', total_points: 0, auth_provider: provider },
      });
    }

    return NextResponse.json({ error: 'Invalid auth provider' }, { status: 400 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
