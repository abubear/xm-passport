import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const db = getDb();
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const cards = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
  const scannedCards = db.prepare("SELECT COUNT(*) as count FROM cards WHERE owner_id IS NOT NULL").get() as { count: number };
  const etickets = db.prepare('SELECT COUNT(*) as count FROM etickets').get() as { count: number };
  const listings = db.prepare("SELECT COUNT(*) as count FROM marketplace_listings WHERE status = 'active'").get() as { count: number };
  const totalPoints = db.prepare('SELECT SUM(total_points) as total FROM users').get() as { total: number };
  const products = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

  const stats = [
    { label: 'Users', value: users.count },
    { label: 'Total Cards', value: cards.count },
    { label: 'Cards Scanned', value: scannedCards.count },
    { label: 'Active Listings', value: listings.count },
    { label: 'E-Tickets', value: etickets.count },
    { label: 'Products', value: products.count },
    { label: 'Total Points', value: (totalPoints.total || 0).toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">XM Passport system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-xm-card rounded-xl p-4 border border-gray-800">
            <p className="text-2xl font-bold text-xm-gold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Users</h2>
        <div className="bg-xm-card rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="p-3 text-xs text-gray-500">Collector #</th>
                <th className="p-3 text-xs text-gray-500">Name</th>
                <th className="p-3 text-xs text-gray-500">Email</th>
                <th className="p-3 text-xs text-gray-500">Rank</th>
                <th className="p-3 text-xs text-gray-500">Points</th>
              </tr>
            </thead>
            <tbody>
              {(db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 5').all() as any[]).map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50">
                  <td className="p-3 text-xs text-xm-gold">{user.collector_number}</td>
                  <td className="p-3 text-xs">{user.display_name}</td>
                  <td className="p-3 text-xs text-gray-400">{user.email}</td>
                  <td className="p-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      user.rank === 'master' ? 'bg-xm-gold/20 text-xm-gold' :
                      user.rank === 'platinum' ? 'bg-blue-500/20 text-blue-400' :
                      user.rank === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{user.rank}</span>
                  </td>
                  <td className="p-3 text-xs">{user.total_points?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
