import { getAuthToken, verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminCards() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const db = getDb();
  const cards = db.prepare(`
    SELECT c.*, u.display_name as owner_name, u.collector_number as owner_number
    FROM cards c LEFT JOIN users u ON c.owner_id = u.id
    ORDER BY c.created_at DESC
  `).all() as any[];

  const total = cards.length;
  const scanned = cards.filter((c: any) => c.owner_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Card Management</h1>
        <div className="flex gap-2">
          <button className="xm-btn-secondary text-xs">Generate QR Codes</button>
          <button className="xm-btn-primary text-xs">Add Cards</button>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-gray-500">{total} total</span>
        <span className="text-green-400">{scanned} scanned</span>
        <span className="text-gray-600">{total - scanned} available</span>
      </div>

      <div className="bg-xm-card rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="p-3 text-xs text-gray-500">Code</th>
              <th className="p-3 text-xs text-gray-500">Product</th>
              <th className="p-3 text-xs text-gray-500">IP</th>
              <th className="p-3 text-xs text-gray-500">Rarity</th>
              <th className="p-3 text-xs text-gray-500">Owner</th>
              <th className="p-3 text-xs text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-b border-gray-800/50 hover:bg-xm-dark/50">
                <td className="p-3 text-xs text-xm-gold font-mono">{card.card_code}</td>
                <td className="p-3 text-xs">{card.product_name}</td>
                <td className="p-3 text-xs text-gray-400">{card.ip}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    card.rarity === 'legendary' ? 'bg-xm-gold/20 text-xm-gold' :
                    card.rarity === 'ultra-rare' ? 'bg-purple-500/20 text-purple-400' :
                    card.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{card.rarity}</span>
                </td>
                <td className="p-3 text-xs">
                  {card.owner_name ? (
                    <span>{card.owner_name} <span className="text-gray-500">({card.owner_number})</span></span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="p-3 text-xs">{card.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
