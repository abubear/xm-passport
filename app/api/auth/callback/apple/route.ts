// Apple Sign In callback handler
// In production: validates identity_token with Apple's public keys,
// extracts user info, creates/finds user, sets JWT cookie.

import { NextRequest, NextResponse } from 'next/server';
import { sql, query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// POST because Apple sends the credential via client-side JS redirect
export async function POST(req: NextRequest) {
  try {
    const { identity_token, user: appleUser, fullName } = await req.json();

    if (!identity_token || !appleUser) {
      return NextResponse.json({ error: 'Missing Apple identity token' }, { status: 400 });
    }

    // In production: verify identity_token with Apple's /auth/keys endpoint
    // const decoded = await verifyAppleToken(identity_token);
    const provider_id = appleUser; // Apple's stable user identifier
    const email = `${provider_id}@privaterelay.appleid.com`; // Apple private relay

    // Find existing user
    let userRows = await sql(
      "SELECT * FROM users WHERE auth_provider = 'apple' AND provider_id = $1", [provider_id]
    );
    let user = userRows[0] || null;

    if (!user) {
      // Create new user
      const id = uuidv4();
      const countRows = await query('SELECT COUNT(*) as count FROM users');
      const count = Number(countRows[0]?.count || 0);
      const collectorNumber = `XM-${String(count + 1).padStart(5, '0')}`;
      const displayName = fullName
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : `Collector ${collectorNumber}`;

      await sql(`
        INSERT INTO users (id, email, display_name, collector_number, auth_provider, provider_id, rank)
        VALUES ($1, $2, $3, $4, 'apple', $5, 'bronze')
      `, [id, email, displayName || `Collector ${collectorNumber}`, collectorNumber, provider_id]);

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
      auth_provider: 'apple',
    });
    setAuthCookie(token);

    return NextResponse.json({ success: true, redirect: '/home' });
  } catch (err) {
    console.error('Apple callback error:', err);
    return NextResponse.json({ error: 'Apple sign-in failed' }, { status: 500 });
  }
}
