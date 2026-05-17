import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { RANK_NAMES, RANK_THRESHOLDS, Card, CollectionJourney } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getUser(userId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
}

function getUserCards(userId: string): Card[] {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE owner_id = ? ORDER BY scanned_at DESC').all(userId) as Card[];
}

function getAvailableJourneys(): CollectionJourney[] {
  const db = getDb();
  return db.prepare('SELECT * FROM collection_journeys').all() as CollectionJourney[];
}

function getUserJourneysStatus(userId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM user_journeys WHERE user_id = ?').all(userId) as any[];
}

function rankProgress(points: number): { currentRank: string; nextRank: string | null; progress: number; pointsNeeded: number } {
  const ranks = ['bronze', 'silver', 'gold', 'platinum', 'master'] as const;
  let currentIdx = 0;
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (points >= RANK_THRESHOLDS[ranks[i]]) {
      currentIdx = i;
      break;
    }
  }
  const nextIdx = currentIdx + 1;
  const nextRank = nextIdx < ranks.length ? ranks[nextIdx] : null;
  const currentThreshold = RANK_THRESHOLDS[ranks[currentIdx]];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : RANK_THRESHOLDS[ranks[currentIdx]];
  const progress = nextThreshold === currentThreshold ? 100 : Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

  return {
    currentRank: ranks[currentIdx],
    nextRank,
    progress: Math.min(progress, 100),
    pointsNeeded: nextRank ? nextThreshold - points : 0,
  };
}

export default async function HomePage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;
  if (!payload) return null;

  const user = getUser(payload.id);
  const cards = getUserCards(payload.id);
  const journeys = getAvailableJourneys();
  const userJourneys = getUserJourneysStatus(payload.id);
  const progress = rankProgress(user?.total_points || 0);

  return (
    <div className="xm-container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Welcome back</p>
          <h1 className="text-xl font-bold">{user?.display_name}</h1>
          <p className="text-xs text-gray-600">{user?.collector_number}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-xm-card flex items-center justify-center text-xm-gold font-bold text-sm">
          {user?.display_name?.charAt(0)?.toUpperCase()}
        </div>
      </div>

      {/* Rank Card */}
      <div className="xm-card-gold rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Collector Rank</p>
            <p className={`text-lg font-bold rank-${progress.currentRank}`}>
              {RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-xm-gold">{user?.total_points?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
        </div>

        {/* Progress bar */}
        {progress.nextRank && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{RANK_NAMES[progress.currentRank as keyof typeof RANK_NAMES]}</span>
              <span>{progress.pointsNeeded.toLocaleString()} pts to {RANK_NAMES[progress.nextRank as keyof typeof RANK_NAMES]}</span>
            </div>
            <div className="h-2 bg-xm-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-xm-gold to-xm-goldLight rounded-full transition-all"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="xm-card text-center">
          <p className="text-2xl font-bold text-xm-gold">{cards.length}</p>
          <p className="text-xs text-gray-500">Cards</p>
        </div>
        <div className="xm-card text-center">
          <p className="text-2xl font-bold text-xm-gold">{user?.collection_count || 0}</p>
          <p className="text-xs text-gray-500">Collected</p>
        </div>
        <div className="xm-card text-center">
          <p className="text-2xl font-bold text-xm-gold">{journeys.length}</p>
          <p className="text-xs text-gray-500">Journeys</p>
        </div>
      </div>

      {/* Recent Cards */}
      {cards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Recent Scans</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cards.slice(0, 5).map((card) => (
              <div
                key={card.id}
                className={`rarity-${card.rarity} flex-shrink-0 w-28 h-36 rounded-xl p-2 flex flex-col justify-end`}
                style={{
                  background: `linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.9) 100%), var(--xm-card)`,
                }}
              >
                <p className="text-xs font-medium truncate">{card.product_name}</p>
                <p className="text-[10px] text-gray-400">{card.ip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Journeys */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Collection Journeys</h2>
          <a href="/journeys" className="text-xs text-xm-gold">View all</a>
        </div>
        <div className="space-y-3">
          {journeys.slice(0, 2).map((journey) => {
            const userJourney = userJourneys.find((uj: any) => uj.journey_id === journey.id);
            const required = JSON.parse(journey.required_items || '[]');
            const collected = userJourney ? Object.keys(JSON.parse(userJourney.progress || '{}')).length : 0;
            const pct = Math.round((collected / required.length) * 100);

            return (
              <div key={journey.id} className="xm-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{journey.name}</p>
                    <p className="text-xs text-gray-500">{journey.ip}</p>
                  </div>
                  <span className="text-xs text-xm-gold">+{journey.reward_points} pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-xm-dark rounded-full overflow-hidden">
                    <div className="h-full bg-xm-gold rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{collected}/{required.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
