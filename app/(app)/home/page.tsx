     1|import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
     2|import {sql, query} from '@/lib/db';
     3|import { RANK_NAMES, RANK_THRESHOLDS, Card, CollectionJourney } from '@/lib/types';
     4|
     5|export const dynamic = 'force-dynamic';
     6|
     7|async function getUser(userId: string) {
     8|  const rows = await query('SELECT * FROM users WHERE id = $1', [userId]);
     9|  return rows[0] || null;
    10|}
    11|
    12|async function getUserCards(userId: string): Promise<Card[]> {
    13|  return await query('SELECT * FROM cards WHERE owner_id = $1 ORDER BY scanned_at DESC', [userId]) as Card[];
    14|}
    15|
    16|async function getAvailableJourneys(): Promise<CollectionJourney[]> {
    17|  return await query('SELECT * FROM collection_journeys') as CollectionJourney[];
    18|}
    19|
    20|async function getUserJourneysStatus(userId: string) {
    21|  return await query('SELECT * FROM user_journeys WHERE user_id = $1', [userId]);
    22|}
    23|
    24|function rankProgress(points: number): { currentRank: string; nextRank: string | null; progress: number; pointsNeeded: number } {
    25|  const ranks = ['bronze', 'silver', 'gold', 'platinum', 'master'] as const;
    26|  let currentIdx = 0;
    27|  for (let i = ranks.length - 1; i >= 0; i--) {
    28|    if (points >= RANK_THRESHOLDS[ranks[i]]) {
    29|      currentIdx = i;
    30|      break;
    31|    }
    32|  }
    33|  const nextIdx = currentIdx + 1;
    34|  const nextRank = nextIdx < ranks.length ? ranks[nextIdx] : null;
    35|  const currentThreshold = RANK_THRESHOLDS[ranks[currentIdx]];
    36|  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : RANK_THRESHOLDS[ranks[currentIdx]];
    37|  const progress = nextThreshold === currentThreshold ? 100 : Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    38|
    39|  return {
    40|    currentRank: ranks[currentIdx],
    41|    nextRank,
    42|    progress: Math.min(progress, 100),
    43|    pointsNeeded: nextRank ? nextThreshold - points : 0,
    44|  };
    45|}
    46|
    47|export default async function HomePage() {
    48|  const token = getAuthToken();
    49|  if (!token) return null;
    50|  const payload = verifyToken(token) as UserPayload;
    51|  if (!payload) return null;
    52|
    53|  const user = await getUser(payload.id);
    54|  const cards = await getUserCards(payload.id);
    55|  const journeys = await getAvailableJourneys();
    56|  const userJourneys = await getUserJourneysStatus(payload.id);
    57|  const progress = rankProgress(user?.total_points || 0);
    58|
    59|  return (
    60|    <div className="xm-container py-6 space-y-6">
    61|      {/* Header */}
    62|      <div className="flex items-center justify-between">
    63|        <div>
    64|          <p className="text-xs text-gray-500">Welcome back</p>
    65|          <h1 className="text-xl font-bold">{user?.display_name}</h1>
    66|          <p className="text-xs text-gray-600">{user?.collector_number}</p>
    67|        </div>
    68|        <div className="w-10 h-10 rounded-full bg-xm-card flex items-center justify-center text-xm-gold font-bold text-sm">
    69|          {user?.display_name?.charAt(0)?.toUpperCase()}
    70|        </div>
    71|      </div>
    72|
    73|      {/* Rank Card */}
    74|      <div className="xm-card-gold rounded-2xl p-4">
    75|        <div className="flex items-center justify-between mb-3">
    76|          <div>
    77|            <p className="text-xs text-gray-500">Collector Rank</p>
    78|            <p className={`text-lg font-bold rank-${progress.currentRank}`}>
    79|              {RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}
    80|            </p>
    81|          </div>
    82|          <div className="text-right">
    83|            <p className="text-2xl font-bold text-xm-gold">{user?.total_points?.toLocaleString()}</p>
    84|            <p className="text-xs text-gray-500">Points</p>
    85|          </div>
    86|        </div>
    87|
    88|        {/* Progress bar */}
    89|        {progress.nextRank && (
    90|          <div>
    91|            <div className="flex justify-between text-xs text-gray-500 mb-1">
    92|              <span>{RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}</span>
    93|              <span>{progress.pointsNeeded.toLocaleString()} pts to {RANK_NAMES[progress.nextRank as keyof typeof RANK_NAMES]}</span>
    94|            </div>
    95|            <div className="h-2 bg-xm-dark rounded-full overflow-hidden">
    96|              <div
    97|                className="h-full bg-gradient-to-r from-xm-gold to-xm-goldLight rounded-full transition-all"
    98|                style={{ width: `${progress.progress}%` }}
    99|              />
   100|            </div>
   101|          </div>
   102|        )}
   103|      </div>
   104|
   105|      {/* Quick Stats */}
   106|      <div className="grid grid-cols-3 gap-3">
   107|        <div className="xm-card text-center">
   108|          <p className="text-2xl font-bold text-xm-gold">{cards.length}</p>
   109|          <p className="text-xs text-gray-500">Cards</p>
   110|        </div>
   111|        <div className="xm-card text-center">
   112|          <p className="text-2xl font-bold text-xm-gold">{user?.collection_count || 0}</p>
   113|          <p className="text-xs text-gray-500">Collected</p>
   114|        </div>
   115|        <div className="xm-card text-center">
   116|          <p className="text-2xl font-bold text-xm-gold">{journeys.length}</p>
   117|          <p className="text-xs text-gray-500">Journeys</p>
   118|        </div>
   119|      </div>
   120|
   121|      {/* Recent Cards */}
   122|      {cards.length > 0 && (
   123|        <div>
   124|          <h2 className="text-sm font-semibold mb-3">Recent Scans</h2>
   125|          <div className="flex gap-3 overflow-x-auto pb-2">
   126|            {cards.slice(0, 5).map((card) => (
   127|              <div
   128|                key={card.id}
   129|                className={`rarity-${card.rarity} flex-shrink-0 w-28 h-36 rounded-xl p-2 flex flex-col justify-end`}
   130|                style={{
   131|                  background: `linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.9) 100%), var(--xm-card)`,
   132|                }}
   133|              >
   134|                <p className="text-xs font-medium truncate">{card.product_name}</p>
   135|                <p className="text-[10px] text-gray-400">{card.ip}</p>
   136|              </div>
   137|            ))}
   138|          </div>
   139|        </div>
   140|      )}
   141|
   142|      {/* Collection Journeys */}
   143|      <div>
   144|        <div className="flex items-center justify-between mb-3">
   145|          <h2 className="text-sm font-semibold">Collection Journeys</h2>
   146|          <a href="/journeys" className="text-xs text-xm-gold">View all</a>
   147|        </div>
   148|        <div className="space-y-3">
   149|          {journeys.slice(0, 2).map((journey) => {
   150|            const userJourney = userJourneys.find((uj: any) => uj.journey_id === journey.id);
   151|            const required = JSON.parse(journey.required_items || '[]');
   152|            const collected = userJourney ? Object.keys(JSON.parse(userJourney.progress || '{}')).length : 0;
   153|            const pct = Math.round((collected / required.length) * 100);
   154|
   155|            return (
   156|              <div key={journey.id} className="xm-card">
   157|                <div className="flex items-center justify-between mb-2">
   158|                  <div>
   159|                    <p className="text-sm font-medium">{journey.name}</p>
   160|                    <p className="text-xs text-gray-500">{journey.ip}</p>
   161|                  </div>
   162|                  <span className="text-xs text-xm-gold">+{journey.reward_points} pts</span>
   163|                </div>
   164|                <div className="flex items-center gap-2">
   165|                  <div className="flex-1 h-1.5 bg-xm-dark rounded-full overflow-hidden">
   166|                    <div className="h-full bg-xm-gold rounded-full" style={{ width: `${pct}%` }} />
   167|                  </div>
   168|                  <span className="text-xs text-gray-500">{collected}/{required.length}</span>
   169|                </div>
   170|              </div>
   171|            );
   172|          })}
   173|        </div>
   174|      </div>
   175|    </div>
   176|  );
   177|}
   178|