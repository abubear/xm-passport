import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { sql, query } from '@/lib/db';
import { RANK_NAMES, RANK_THRESHOLDS, PointsTransaction } from '@/lib/types';
import { clearAuthCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const userRows = await query('SELECT id, email, phone, display_name, collector_number, avatar_url, bio, location, collection_prefs, public_profile, social_links, rank, total_points, rank_points, collection_count, verified_collector, auth_provider, created_at FROM users WHERE id = $1', [payload.id]);
  const user = userRows[0] || null;

    const transactionRows = await query('SELECT * FROM points_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [payload.id]);
  const transactions = transactionRows as PointsTransaction[];

  function rankProgress(points: number) {
    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'master'] as const;
    let currentIdx = 0;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (points >= RANK_THRESHOLDS[ranks[i]]) { currentIdx = i; break; }
    }
    const nextIdx = currentIdx + 1;
    const nextRank = nextIdx < ranks.length ? ranks[nextIdx] : null;
    const currentThresh = RANK_THRESHOLDS[ranks[currentIdx]];
    const nextThresh = nextRank ? RANK_THRESHOLDS[nextRank] : currentThresh;
    return {
      currentRank: ranks[currentIdx],
      nextRank,
      progress: nextThresh === currentThresh ? 100 : Math.min(Math.round(((points - currentThresh) / (nextThresh - currentThresh)) * 100), 100),
    };
  }

  const progress = rankProgress(user?.total_points || 0);
  const cardRows = await query('SELECT COUNT(*) as count FROM cards WHERE owner_id = $1', [payload.id]);
  const cards = (cardRows[0] as { count: number }) || { count: 0 };
  const collectionPrefs: string[] = (() => { try { return JSON.parse(user?.collection_prefs || '[]'); } catch { return []; } })();
  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(user?.social_links || '{}'); } catch { return {}; } })();
  const languageNames: Record<string, string> = { en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文' };

  return (
    <div className="xm-container py-6 space-y-6 page-content">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-xm-card border-2 border-xm-gold/30 flex items-center justify-center text-3xl font-bold text-xm-gold mb-3 relative">
          {user?.display_name?.charAt(0)?.toUpperCase()}
          {user?.verified_collector ? (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs text-white">✓</span>
          ) : null}
        </div>
        <h1 className="text-xl font-bold">{user?.display_name}</h1>
        <p className="text-sm text-xm-gold">{user?.collector_number}</p>
        <p className={`text-sm mt-1 rank-${progress.currentRank}`}>
          {RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}
        </p>

        <Link href="/profile/edit" className="inline-block mt-3 text-xs text-xm-gold border border-xm-gold/30 rounded-lg px-4 py-1.5 hover:bg-xm-gold/10 transition-colors">
          Edit Profile
        </Link>
      </div>

      {/* Bio + Location */}
      {(user?.bio || user?.location) && (
        <div className="xm-card text-center">
          {user?.bio && <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>}
          {user?.location && (
            <p className="text-xs text-gray-500 mt-2">📍 {user.location}</p>
          )}
        </div>
      )}

      {/* Collection Preferences */}
      {collectionPrefs.length > 0 && (
        <div className="xm-card">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Collects</h3>
          <div className="flex flex-wrap gap-1.5">
            {collectionPrefs.map((ip: string) => (
              <span key={ip} className="text-[10px] px-2 py-1 rounded-full bg-xm-gold/10 text-xm-gold border border-xm-gold/20">
                {ip}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {Object.values(socialLinks).some(Boolean) && (
        <div className="xm-card">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Connect</h3>
          <div className="flex gap-3">
            {Object.entries(socialLinks).map(([platform, url]) =>
              url ? (
                <a key={platform} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener" className="text-xs text-xm-gold hover:underline capitalize">
                  {platform}
                </a>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">{(user?.total_points || 0).toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">Total Points</p>
        </div>
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">{Number(cards.count)}</p>
          <p className="text-[10px] text-gray-500">Cards Collected</p>
        </div>
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">{user?.collection_count || 0}</p>
          <p className="text-[10px] text-gray-500">Set Items</p>
        </div>
        <div className="xm-card text-center py-3">
          <p className={`text-xl font-bold ${user?.verified_collector ? 'text-green-400' : 'text-gray-500'}`}>
            {user?.verified_collector ? '✓' : '—'}
          </p>
          <p className="text-[10px] text-gray-500">Verified</p>
        </div>
      </div>

      {/* Rank Progress */}
      <div className="xm-card-gold rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">Rank Progress</h3>
        <div className="space-y-3">
          {(['bronze', 'silver', 'gold', 'platinum', 'master'] as const).map((rank) => {
            const unlocked = RANK_THRESHOLDS[rank] <= (user?.total_points || 0);
            return (
              <div key={rank} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  unlocked ? 'bg-xm-gold/20 text-xm-gold' : 'bg-xm-dark text-gray-600'
                }`}>
                  {unlocked ? '✓' : rank.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${unlocked ? 'text-xm-gold' : 'text-gray-600'}`}>
                    {RANK_NAMES[rank]}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{RANK_THRESHOLDS[rank].toLocaleString()} pts</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy */}
      <div className="xm-card flex items-center justify-between">
        <div>
          <p className="text-sm">Profile Visibility</p>
          <p className="text-xs text-gray-500">{user?.public_profile ? 'Public — other collectors can find you' : 'Private — only you can see your profile'}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${user?.public_profile ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
          {user?.public_profile ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Points History */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Points History</h3>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-xs capitalize">{tx.reason.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <form
        action={async () => {
          'use server';
          clearAuthCookie();
          redirect('/');
        }}
      >
        <button type="submit" className="xm-btn-secondary w-full text-sm text-red-400">
          Sign Out
        </button>
      </form>

      <p className="text-[10px] text-gray-700 text-center pb-4">
        XM Passport v1.0 · Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
      </p>
    </div>
  );
}
