     1|import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
     2|import {sql, query} from '@/lib/db';
     3|import { RANK_NAMES, RANK_THRESHOLDS, PointsTransaction } from '@/lib/types';
     4|import { clearAuthCookie } from '@/lib/auth';
     5|import { redirect } from 'next/navigation';
     6|import Link from 'next/link';
     7|
     8|export const dynamic = 'force-dynamic';
     9|
    10|export default async function ProfilePage() {
    11|  const token = getAuthToken();
    12|  if (!token) return null;
    13|  const payload = verifyToken(token) as UserPayload;
    14|
    15|  const userRows = await sql(`
    16|    SELECT id, email, phone, display_name, collector_number, avatar_url,
    17|           bio, location, collection_prefs, public_profile, social_links,
    18|           rank, total_points, rank_points, collection_count, verified_collector,
    19|           auth_provider, created_at
    20|    FROM users WHERE id = $1
    21|  `, [payload.id]);
    22|  const user = userRows[0] || null;
    23|
    24|  const transactionRows = await sql(
    25|    'SELECT * FROM points_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    26|    [payload.id]
    27|  );
    28|  const transactions = transactionRows as PointsTransaction[];
    29|
    30|  function rankProgress(points: number) {
    31|    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'master'] as const;
    32|    let currentIdx = 0;
    33|    for (let i = ranks.length - 1; i >= 0; i--) {
    34|      if (points >= RANK_THRESHOLDS[ranks[i]]) { currentIdx = i; break; }
    35|    }
    36|    const nextIdx = currentIdx + 1;
    37|    const nextRank = nextIdx < ranks.length ? ranks[nextIdx] : null;
    38|    const currentThresh = RANK_THRESHOLDS[ranks[currentIdx]];
    39|    const nextThresh = nextRank ? RANK_THRESHOLDS[nextRank] : currentThresh;
    40|    return {
    41|      currentRank: ranks[currentIdx],
    42|      nextRank,
    43|      progress: nextThresh === currentThresh ? 100 : Math.min(Math.round(((points - currentThresh) / (nextThresh - currentThresh)) * 100), 100),
    44|    };
    45|  }
    46|
    47|  const progress = rankProgress(user?.total_points || 0);
    48|  const cardRows = await query('SELECT COUNT(*) as count FROM cards WHERE owner_id = $1', [payload.id]);
    49|  const cards = (cardRows[0] as { count: number }) || { count: 0 };
    50|  const collectionPrefs: string[] = (() => { try { return JSON.parse(user?.collection_prefs || '[]'); } catch { return []; } })();
    51|  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(user?.social_links || '{}'); } catch { return {}; } })();
    52|  const languageNames: Record<string, string> = { en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文' };
    53|
    54|  return (
    55|    <div className="xm-container py-6 space-y-6 page-content">
    56|      {/* Profile Header */}
    57|      <div className="text-center">
    58|        <div className="w-24 h-24 mx-auto rounded-full bg-xm-card border-2 border-xm-gold/30 flex items-center justify-center text-3xl font-bold text-xm-gold mb-3 relative">
    59|          {user?.display_name?.charAt(0)?.toUpperCase()}
    60|          {user?.verified_collector ? (
    61|            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs text-white">✓</span>
    62|          ) : null}
    63|        </div>
    64|        <h1 className="text-xl font-bold">{user?.display_name}</h1>
    65|        <p className="text-sm text-xm-gold">{user?.collector_number}</p>
    66|        <p className={`text-sm mt-1 rank-${progress.currentRank}`}>
    67|          {RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}
    68|        </p>
    69|
    70|        <Link href="/profile/edit" className="inline-block mt-3 text-xs text-xm-gold border border-xm-gold/30 rounded-lg px-4 py-1.5 hover:bg-xm-gold/10 transition-colors">
    71|          Edit Profile
    72|        </Link>
    73|      </div>
    74|
    75|      {/* Bio + Location */}
    76|      {(user?.bio || user?.location) && (
    77|        <div className="xm-card text-center">
    78|          {user?.bio && <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>}
    79|          {user?.location && (
    80|            <p className="text-xs text-gray-500 mt-2">📍 {user.location}</p>
    81|          )}
    82|        </div>
    83|      )}
    84|
    85|      {/* Collection Preferences */}
    86|      {collectionPrefs.length > 0 && (
    87|        <div className="xm-card">
    88|          <h3 className="text-xs font-semibold text-gray-500 mb-2">Collects</h3>
    89|          <div className="flex flex-wrap gap-1.5">
    90|            {collectionPrefs.map((ip: string) => (
    91|              <span key={ip} className="text-[10px] px-2 py-1 rounded-full bg-xm-gold/10 text-xm-gold border border-xm-gold/20">
    92|                {ip}
    93|              </span>
    94|            ))}
    95|          </div>
    96|        </div>
    97|      )}
    98|
    99|      {/* Social Links */}
   100|      {Object.values(socialLinks).some(Boolean) && (
   101|        <div className="xm-card">
   102|          <h3 className="text-xs font-semibold text-gray-500 mb-2">Connect</h3>
   103|          <div className="flex gap-3">
   104|            {Object.entries(socialLinks).map(([platform, url]) =>
   105|              url ? (
   106|                <a key={platform} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener" className="text-xs text-xm-gold hover:underline capitalize">
   107|                  {platform}
   108|                </a>
   109|              ) : null
   110|            )}
   111|          </div>
   112|        </div>
   113|      )}
   114|
   115|      {/* Stats Grid */}
   116|      <div className="grid grid-cols-2 gap-3">
   117|        <div className="xm-card text-center py-3">
   118|          <p className="text-xl font-bold text-xm-gold">{(user?.total_points || 0).toLocaleString()}</p>
   119|          <p className="text-[10px] text-gray-500">Total Points</p>
   120|        </div>
   121|        <div className="xm-card text-center py-3">
   122|          <p className="text-xl font-bold text-xm-gold">{Number(cards.count)}</p>
   123|          <p className="text-[10px] text-gray-500">Cards Collected</p>
   124|        </div>
   125|        <div className="xm-card text-center py-3">
   126|          <p className="text-xl font-bold text-xm-gold">{user?.collection_count || 0}</p>
   127|          <p className="text-[10px] text-gray-500">Set Items</p>
   128|        </div>
   129|        <div className="xm-card text-center py-3">
   130|          <p className={`text-xl font-bold ${user?.verified_collector ? 'text-green-400' : 'text-gray-500'}`}>
   131|            {user?.verified_collector ? '✓' : '—'}
   132|          </p>
   133|          <p className="text-[10px] text-gray-500">Verified</p>
   134|        </div>
   135|      </div>
   136|
   137|      {/* Rank Progress */}
   138|      <div className="xm-card-gold rounded-2xl p-4">
   139|        <h3 className="text-sm font-semibold mb-3">Rank Progress</h3>
   140|        <div className="space-y-3">
   141|          {(['bronze', 'silver', 'gold', 'platinum', 'master'] as const).map((rank) => {
   142|            const unlocked = RANK_THRESHOLDS[rank] <= (user?.total_points || 0);
   143|            return (
   144|              <div key={rank} className="flex items-center gap-3">
   145|                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
   146|                  unlocked ? 'bg-xm-gold/20 text-xm-gold' : 'bg-xm-dark text-gray-600'
   147|                }`}>
   148|                  {unlocked ? '✓' : rank.charAt(0).toUpperCase()}
   149|                </div>
   150|                <div className="flex-1">
   151|                  <p className={`text-xs ${unlocked ? 'text-xm-gold' : 'text-gray-600'}`}>
   152|                    {RANK_NAMES[rank]}
   153|                  </p>
   154|                </div>
   155|                <p className="text-xs text-gray-500">{RANK_THRESHOLDS[rank].toLocaleString()} pts</p>
   156|              </div>
   157|            );
   158|          })}
   159|        </div>
   160|      </div>
   161|
   162|      {/* Privacy */}
   163|      <div className="xm-card flex items-center justify-between">
   164|        <div>
   165|          <p className="text-sm">Profile Visibility</p>
   166|          <p className="text-xs text-gray-500">{user?.public_profile ? 'Public — other collectors can find you' : 'Private — only you can see your profile'}</p>
   167|        </div>
   168|        <span className={`text-xs px-2 py-1 rounded-full ${user?.public_profile ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
   169|          {user?.public_profile ? 'Public' : 'Private'}
   170|        </span>
   171|      </div>
   172|
   173|      {/* Points History */}
   174|      {transactions.length > 0 && (
   175|        <div>
   176|          <h3 className="text-sm font-semibold mb-3">Points History</h3>
   177|          <div className="space-y-2">
   178|            {transactions.slice(0, 5).map((tx) => (
   179|              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800">
   180|                <div>
   181|                  <p className="text-xs capitalize">{tx.reason.replace(/_/g, ' ')}</p>
   182|                  <p className="text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
   183|                </div>
   184|                <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
   185|                  {tx.amount > 0 ? '+' : ''}{tx.amount}
   186|                </span>
   187|              </div>
   188|            ))}
   189|          </div>
   190|        </div>
   191|      )}
   192|
   193|      {/* Sign Out */}
   194|      <form
   195|        action={async () => {
   196|          'use server';
   197|          clearAuthCookie();
   198|          redirect('/');
   199|        }}
   200|      >
   201|        <button type="submit" className="xm-btn-secondary w-full text-sm text-red-400">
   202|          Sign Out
   203|        </button>
   204|      </form>
   205|
   206|      <p className="text-[10px] text-gray-700 text-center pb-4">
   207|        XM Passport v1.0 · Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
   208|      </p>
   209|    </div>
   210|  );
   211|}
   212|