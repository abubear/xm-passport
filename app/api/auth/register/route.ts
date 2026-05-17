import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, display_name, auth_provider, provider_id, wechat_unionid } = body;

    if (!display_name) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 });
    }

    const provider = auth_provider || 'email';

    // --- Email signup ---
    if (provider === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const existingRows = await sql('SELECT id FROM users WHERE email = $1', [email]);
      if (existingRows.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const id = uuidv4();
      const passwordHash = await hashPassword(password);
      const countRows = await sql('SELECT COUNT(*) as count FROM users');
      const count = countRows[0] as { count: number };
      const collectorNumber = `XM-${String(Number(count.count) + 1).padStart(5, '0')}`;

      await sql(`
        INSERT INTO users (id, email, password_hash, display_name, collector_number, auth_provider, rank)
        VALUES ($1, $2, $3, $4, $5, 'email', 'bronze')
      `, [id, email, passwordHash, display_name, collectorNumber]);

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

      const existingRows = await sql('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existingRows.length > 0) {
        return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });
      }

      const id = uuidv4();
      const countRows = await sql('SELECT COUNT(*) as count FROM users');
      const count = countRows[0] as { count: number };
      const collectorNumber = `XM-${String(Number(count.count) + 1).padStart(5, '0')}`;

      await sql(`
        INSERT INTO users (id, phone, display_name, collector_number, auth_provider, rank)
        VALUES ($1, $2, $3, $4, 'phone', 'bronze')
      `, [id, phone, display_name, collectorNumber]);

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
      const existingByProviderRows = await sql(
        'SELECT id FROM users WHERE auth_provider = $1 AND provider_id = $2',
        [provider, provider_id]
      );

      if (existingByProviderRows.length > 0) {
        return NextResponse.json({ error: 'Already registered with this account' }, { status: 409 });
      }

      // For WeChat, also check unionid
      if (provider === 'wechat' && wechat_unionid) {
        const existingByUnionRows = await sql('SELECT id FROM users WHERE wechat_unionid = $1', [wechat_unionid]);
        if (existingByUnionRows.length > 0) {
          return NextResponse.json({ error: 'WeChat account already linked' }, { status: 409 });
        }
      }

      const id = uuidv4();
      const countRows = await sql('SELECT COUNT(*) as count FROM users');
      const count = countRows[0] as { count: number };
      const collectorNumber = `XM-${String(Number(count.count) + 1).padStart(5, '0')}`;

      // Social signup may also provide email
      const socialEmail = email || null;
      if (socialEmail) {
        const existingEmailRows = await sql('SELECT id FROM users WHERE email = $1', [socialEmail]);
        if (existingEmailRows.length > 0) {
          return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }
      }

      await sql(`
        INSERT INTO users (id, email, display_name, collector_number, auth_provider, provider_id, wechat_unionid, rank)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'bronze')
      `, [id, socialEmail, display_name, collectorNumber, provider, provider_id, wechat_unionid || null]);

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
