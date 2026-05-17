import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminMarketplace() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const db = getDb();
  const listings = db.prepare(`
    SELECT ml.*, s.display_name as seller_name, b.display_name as buyer_name
    FROM marketplace_listings ml
    JOIN users s ON ml.seller_id = s.id
    LEFT JOIN users b ON ml.buyer_id = b.id
    ORDER BY ml.created_at DESC
  `).all() as any[];

  const activeListings = listings.filter((l: any) => l.status === 'active').length;
  const soldListings = listings.filter((l: any) => l.status === 'sold').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace Management</h1>

      <div className="flex gap-4 text-sm">
        <span className="text-gray-500">{listings.length} total</span>
        <span className="text-xm-gold">{activeListings} active</span>
        <span className="text-green-400">{soldListings} sold</span>
      </div>

      <div className="bg-xm-card rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="p-3 text-xs text-gray-500">Item Type</th>
              <th className="p-3 text-xs text-gray-500">Price</th>
              <th className="p-3 text-xs text-gray-500">Seller</th>
              <th className="p-3 text-xs text-gray-500">Buyer</th>
              <th className="p-3 text-xs text-gray-500">Status</th>
              <th className="p-3 text-xs text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-gray-800/50 hover:bg-xm-dark/50">
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    listing.item_type === 'card' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>{listing.item_type}</span>
                </td>
                <td className="p-3 text-xs text-xm-gold">${listing.price?.toLocaleString()}</td>
                <td className="p-3 text-xs">{listing.seller_name}</td>
                <td className="p-3 text-xs">{listing.buyer_name || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    listing.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                    listing.status === 'active' ? 'bg-xm-gold/20 text-xm-gold' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{listing.status}</span>
                </td>
                <td className="p-3 text-xs text-gray-500">{new Date(listing.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
