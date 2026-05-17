import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Card, ETicket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const db = getDb();
  const cards = db.prepare('SELECT * FROM cards WHERE owner_id = ? ORDER BY scanned_at DESC').all(payload.id) as Card[];
  const etickets = db.prepare('SELECT * FROM etickets WHERE owner_id = ? ORDER BY created_at DESC').all(payload.id) as ETicket[];

  return (
    <div className="xm-container py-6 space-y-6">
      <h1 className="text-xl font-bold">My Vault</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">{cards.length}</p>
          <p className="text-[10px] text-gray-500">Cards</p>
        </div>
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">{etickets.length}</p>
          <p className="text-[10px] text-gray-500">E-Tickets</p>
        </div>
        <div className="xm-card text-center py-3">
          <p className="text-xl font-bold text-xm-gold">
            {cards.reduce((sum, c) => sum + c.points_value, 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">Pts Value</p>
        </div>
      </div>

      {/* Metal Cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Metal Cards</h2>
        {cards.length === 0 ? (
          <div className="xm-card text-center py-8">
            <div className="text-4xl mb-2">🃏</div>
            <p className="text-sm text-gray-500">No cards yet</p>
            <p className="text-xs text-gray-600 mt-1">Tap Scan to add your first card</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <div key={card.id} className={`xm-card rarity-${card.rarity} relative overflow-hidden`}>
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    card.rarity === 'legendary' ? 'bg-xm-gold/20 text-xm-gold' :
                    card.rarity === 'ultra-rare' ? 'bg-purple-500/20 text-purple-400' :
                    card.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {card.rarity}
                  </span>
                </div>
                <div className="h-24 rounded-lg bg-xm-dark mb-2 flex items-center justify-center text-3xl">
                  🎴
                </div>
                <p className="text-xs font-medium truncate">{card.product_name}</p>
                <p className="text-[10px] text-gray-500">{card.ip}</p>
                <p className="text-[10px] text-xm-gold mt-1">+{card.points_value} pts</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* E-Tickets */}
      {etickets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">E-Tickets</h2>
          <div className="space-y-3">
            {etickets.map((ticket) => (
              <div key={ticket.id} className="xm-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ticket.product_name}</p>
                    <p className="text-xs text-gray-500">{ticket.ticket_code}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.status === 'redeemed' ? 'bg-green-500/20 text-green-400' :
                      ticket.status === 'active' ? 'bg-xm-gold/20 text-xm-gold' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {ticket.status}
                    </span>
                    {ticket.purchase_price && (
                      <p className="text-xs text-gray-400 mt-1">${ticket.purchase_price}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
