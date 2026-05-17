import { NextRequest, NextResponse } from 'next/server';
import { sql, query } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, auth_provider, provider_id } = body;

    const provider = auth_provider || 'email';

    // --- Email login ---
    if (provider === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const rows = await query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0] || null;
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const valid = await comparePassword(password, user.password_hash || '');
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        rank: user.rank,
        is_admin: user.is_admin,
        auth_provider: 'email',
      });
      setAuthCookie(token);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          display_name: user.display_name,
          collector_number: user.collector_number,
          rank: user.rank,
          total_points: user.total_points,
          is_admin: user.is_admin,
        },
      });
    }

    // --- Phone login ---
    if (provider === 'phone') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }

      const rows = await query('SELECT * FROM users WHERE phone = $1 AND auth_provider = $2', [phone, 'phone']);
      const user = rows[0] || null;
      if (!user) {
        return NextResponse.json({ error: 'Phone not registered' }, { status: 401 });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        rank: user.rank,
        is_admin: user.is_admin,
        auth_provider: 'phone',
      });
      setAuthCookie(token);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          display_name: user.display_name,
          collector_number: user.collector_number,
          rank: user.rank,
          total_points: user.total_points,
          is_admin: user.is_admin,
        },
      });
    }

    // --- Social login (Apple / Google / WeChat) ---
    if (['apple', 'google', 'wechat'].includes(provider)) {
      if (!provider_id) {
        return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
      }

      const rows = await query(
        'SELECT * FROM users WHERE auth_provider = $1 AND provider_id = $2',
        [provider, provider_id]
      );
      const user = rows[0] || null;

      if (!user) {
        return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 401 });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        rank: user.rank,
        is_admin: user.is_admin,
        auth_provider: provider,
      });
      setAuthCookie(token);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          display_name: user.display_name,
          collector_number: user.collector_number,
          rank: user.rank,
          total_points: user.total_points,
          is_admin: user.is_admin,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid auth provider' }, { status: 400 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
