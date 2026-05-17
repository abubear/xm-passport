import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { query } from '@/lib/db';
import { CollectionJourney } from '@/lib/types';
import { getGradientCSS } from '@/lib/gradient-utils';

export const dynamic = 'force-dynamic';

export default async function JourneysPage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const journeyRows = await query('SELECT * FROM collection_journeys');
  const journeys = journeyRows as CollectionJourney[];
  const userCardRows = await query('SELECT card_code FROM cards WHERE owner_id = $1', [payload.id]);
  const userCards = userCardRows as { card_code: string }[];
  const userCardCodes = new Set(userCards.map((c: any) => c.card_code));
  const userJourneyRows = await query('SELECT * FROM user_journeys WHERE user_id = $1', [payload.id]);
  const userJourneys = userJourneyRows as any[];

  return (
    <div className="xm-container py-6 space-y-6">
      <h1 className="text-xl font-bold">Collection Journeys</h1>
      <p className="text-sm text-gray-500">Complete sets to earn bonus points and badges</p>

      {journeys.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-3 overflow-hidden"
            style={{ background: getGradientCSS('empty-journeys', 'product') }}
          >
            <span className="text-3xl text-white/50">🗺️</span>
          </div>
          <p className="text-sm text-gray-500">No journeys available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((journey) => {
            const required = JSON.parse(journey.required_items || '[]');
            const collected = required.filter((code: string) => userCardCodes.has(code));
            const userJourney = userJourneys.find((uj: any) => uj.journey_id === journey.id);
            const pct = Math.round((collected.length / required.length) * 100);
            const completed = userJourney?.completed;

            return (
              <div key={journey.id} className={`xm-card ${completed ? 'xm-card-gold' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">{journey.name}</h3>
                    <p className="text-xs text-gray-500">{journey.ip}</p>
                  </div>
                  {completed ? (
                    <span className="text-xs bg-xm-gold/20 text-xm-gold px-2 py-1 rounded-full">✓ Complete</span>
                  ) : (
                    <span className="text-xs text-xm-gold">+{journey.reward_points} pts</span>
                  )}
                </div>

                {journey.description && (
                  <p className="text-xs text-gray-600 mb-3">{journey.description}</p>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{collected.length} of {required.length} cards</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-xm-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${completed ? 'bg-xm-gold' : 'bg-xm-gold/50'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-1">
                  {required.map((code: string) => {
                    const has = userCardCodes.has(code);
                    return (
                      <div key={code} className="flex items-center gap-2 text-xs">
                        <span className={has ? 'text-green-400' : 'text-gray-700'}>
                          {has ? '●' : '○'}
                        </span>
                        <span className={has ? 'text-gray-300' : 'text-gray-700'}>
                          {code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
