import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalCards = (db.prepare('SELECT COUNT(*) as c FROM cards').get() as any).c;
  const scannedCards = (db.prepare("SELECT COUNT(*) as c FROM cards WHERE owner_id IS NOT NULL").get() as any).c;
  const totalPoints = (db.prepare('SELECT SUM(total_points) as s FROM users').get() as any).s || 0;
  const totalListings = (db.prepare('SELECT COUNT(*) as c FROM marketplace_listings').get() as any).c;
  const soldListings = (db.prepare("SELECT COUNT(*) as c FROM marketplace_listings WHERE status='sold'").get() as any).c;
  const rankDist = db.prepare('SELECT rank, COUNT(*) as c FROM users GROUP BY rank').all() as any[];
  const rarityDist = db.prepare('SELECT rarity, COUNT(*) as c FROM cards GROUP BY rarity').all() as any[];
  const recentScans = db.prepare(`
    SELECT pt.*, u.display_name FROM points_transactions pt
    JOIN users u ON pt.user_id = u.id
    WHERE pt.reason = 'card_scan'
    ORDER BY pt.created_at DESC LIMIT 10
  `).all() as any[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scan Rate', value: `${Math.round((scannedCards / totalCards) * 100)}%`, sub: `${scannedCards}/${totalCards}` },
          { label: 'Avg Points/User', value: Math.round(totalPoints / totalUsers).toLocaleString(), sub: '' },
          { label: 'Sell-Through', value: `${Math.round((soldListings / Math.max(totalListings, 1)) * 100)}%`, sub: `${soldListings}/${totalListings}` },
          { label: 'Total Revenue', value: `$${db.prepare("SELECT SUM(price) as s FROM marketplace_listings WHERE status='sold'").get() ? (db.prepare("SELECT SUM(price) as s FROM marketplace_listings WHERE status='sold'").get() as any).s?.toLocaleString() || 0 : 0}`, sub: '' },
        ].map((m) => (
          <div key={m.label} className="bg-xm-card rounded-xl p-4 border border-gray-800">
            <p className="text-xl font-bold text-xm-gold">{m.value}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
            {m.sub && <p className="text-[10px] text-gray-600 mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-3">Rank Distribution</h2>
          <div className="space-y-2">
            {rankDist.map((r: any) => (
              <div key={r.rank} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{r.rank}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-xm-dark rounded-full overflow-hidden">
                    <div className="h-full bg-xm-gold rounded-full" style={{ width: `${(r.c / totalUsers) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{r.c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Rarity Distribution</h2>
          <div className="space-y-2">
            {rarityDist.map((r: any) => (
              <div key={r.rarity} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{r.rarity}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-xm-dark rounded-full overflow-hidden">
                    <div className="h-full bg-xm-gold rounded-full" style={{ width: `${(r.c / totalCards) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{r.c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Scans</h2>
        <div className="space-y-2">
          {recentScans.map((scan: any) => (
            <div key={scan.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div>
                <span className="text-xs">{scan.display_name}</span>
                <span className="text-xs text-gray-600 ml-2">{new Date(scan.created_at).toLocaleString()}</span>
              </div>
              <span className="text-xs text-green-400">+{scan.amount} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
