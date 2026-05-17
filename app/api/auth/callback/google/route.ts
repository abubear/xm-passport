// Google Sign-In callback handler
// In production: validates credential with Google's tokeninfo endpoint,
// extracts user info, creates/finds user, sets JWT cookie.

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    // In production: verify credential with Google's tokeninfo endpoint
    // const ticket = await verifyGoogleToken(credential);
    // For dev: decode the JWT payload (unverified)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { sub, email, name, picture } = payload;

    if (!sub) {
      return NextResponse.json({ error: 'Invalid Google credential' }, { status: 400 });
    }

    // Find by provider
    let userRows = await query(
      "SELECT * FROM users WHERE auth_provider = 'google' AND provider_id = $1", [sub]
    );
    let user = userRows[0] || null;

    // Also check email match (for users who previously registered with email)
    if (!user && email) {
      const emailRows = await query(
        "SELECT * FROM users WHERE email = $1 AND auth_provider = 'email'", [email]
      );
      user = emailRows[0] || null;
      if (user) {
        // Link Google to existing email account
        await query(
          "UPDATE users SET auth_provider = 'google', provider_id = $1 WHERE id = $2", [sub, user.id]
        );
      }
    }

    if (!user) {
      const id = uuidv4();
      const countRows = await query('SELECT COUNT(*) as count FROM users');
      const count = Number(countRows[0]?.count || 0);
      const collectorNumber = `XM-${String(count + 1).padStart(5, '0')}`;

      await query(`
        INSERT INTO users (id, email, display_name, avatar_url, collector_number, auth_provider, provider_id, rank)
        VALUES ($1, $2, $3, $4, $5, 'google', $6, 'bronze')
      `, [id, email || `${sub}@google.com`, name || `Collector ${collectorNumber}`, picture || null, collectorNumber, sub]);

      const newUserRows = await query('SELECT * FROM users WHERE id = $1', [id]);
      user = newUserRows[0] || null;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      phone: user.phone,
      display_name: user.display_name,
      rank: user.rank,
      is_admin: user.is_admin,
      auth_provider: 'google',
    });
    setAuthCookie(token);

    return NextResponse.json({ success: true, redirect: '/home' });
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.json({ error: 'Google sign-in failed' }, { status: 500 });
  }
}
