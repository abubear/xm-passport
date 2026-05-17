// Apple Sign In callback handler
// In production: validates identity_token with Apple's public keys,
// extracts user info, creates/finds user, sets JWT cookie.

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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

    const db = getDb();

    // Find existing user
    let user = db.prepare(
      "SELECT * FROM users WHERE auth_provider = 'apple' AND provider_id = ?"
    ).get(provider_id) as any;

    if (!user) {
      // Create new user
      const id = uuidv4();
      const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const collectorNumber = `XM-${String(count.count + 1).padStart(5, '0')}`;
      const displayName = fullName
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : `Collector ${collectorNumber}`;

      db.prepare(`
        INSERT INTO users (id, email, display_name, collector_number, auth_provider, provider_id, rank)
        VALUES (?, ?, ?, ?, 'apple', ?, 'bronze')
      `).run(id, email, displayName || `Collector ${collectorNumber}`, collectorNumber, provider_id);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
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
