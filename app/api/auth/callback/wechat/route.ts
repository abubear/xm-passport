// WeChat Login callback handler
// In production: exchanges auth code for access_token via WeChat OAuth API,
// then fetches user info, creates/finds user, sets JWT cookie.

import { NextRequest, NextResponse } from 'next/server';
import { sql, query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing WeChat auth code' }, { status: 400 });
    }

    // In production: exchange code for access_token
    // const tokenRes = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APP_ID}&secret=***&code=***&grant_type=authorization_code`);
    // const { openid, unionid, access_token } = await tokenRes.json();

    // For dev: use code as mock openid
    const openid = `wx_openid_${code.slice(0, 8)}`;
    const unionid = `wx_union_${code.slice(0, 8)}`;

    // Find by provider_id (openid) or unionid
    let userRows = await query(
      "SELECT * FROM users WHERE auth_provider = 'wechat' AND (provider_id = $1 OR wechat_unionid = $2)", [openid, unionid]
    );
    let user = userRows[0] || null;

    if (!user) {
      const id = uuidv4();
      const countRows = await query('SELECT COUNT(*) as count FROM users');
      const count = Number(countRows[0]?.count || 0);
      const collectorNumber = `XM-${String(count + 1).padStart(5, '0')}`;

      await query(`
        INSERT INTO users (id, display_name, collector_number, auth_provider, provider_id, wechat_unionid, rank)
        VALUES ($1, $2, $3, 'wechat', $4, $5, 'bronze')
      `, [id, `WeChat User ${collectorNumber}`, collectorNumber, openid, unionid]);

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
      auth_provider: 'wechat',
    });
    setAuthCookie(token);

    return NextResponse.json({ success: true, redirect: '/home' });
  } catch (err) {
    console.error('WeChat callback error:', err);
    return NextResponse.json({ error: 'WeChat sign-in failed' }, { status: 500 });
  }
}
