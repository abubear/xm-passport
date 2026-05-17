import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { sql } from '@/lib/db';
import { ETicket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RedeemPage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const etickets = await sql`SELECT * FROM etickets WHERE owner_id = ${payload.id} AND status = 'active' ORDER BY created_at DESC` as ETicket[];
  const redeemedTickets = await sql`SELECT * FROM etickets WHERE owner_id = ${payload.id} AND status = 'redeemed' ORDER BY redemption_date DESC` as ETicket[];

  return (
    <div className="xm-container py-6 space-y-6">
      <h1 className="text-xl font-bold">Redeem</h1>
      <p className="text-sm text-gray-500">Convert e-tickets to physical statue delivery</p>

      {/* Active E-Tickets */}
      {etickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎫</div>
          <p className="text-sm text-gray-500">No active e-tickets</p>
          <p className="text-xs text-gray-600 mt-1">Reserve statues from Drops to get e-tickets</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold mb-3">Ready to Redeem</h2>
          <div className="space-y-3">
            {etickets.map((ticket) => (
              <div key={ticket.id} className="xm-card-gold rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-xm-dark flex items-center justify-center text-xl">🎫</div>
                  <div>
                    <p className="text-sm font-semibold">{ticket.product_name}</p>
                    <p className="text-xs text-gray-500">{ticket.ticket_code}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-400 mb-3">
                  <div className="flex justify-between">
                    <span>Payment</span>
                    <span className={
                      ticket.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                    }>{ticket.payment_status}</span>
                  </div>
                  {ticket.purchase_price && (
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span>${ticket.purchase_price.toLocaleString()}</span>
                    </div>
                  )}
                  {ticket.expiry_date && (
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span>{new Date(ticket.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <button
                  disabled={ticket.payment_status !== 'paid'}
                  className={`w-full text-sm py-3 rounded-xl font-semibold ${
                    ticket.payment_status === 'paid'
                      ? 'xm-btn-primary'
                      : 'xm-btn-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  {ticket.payment_status === 'paid' ? 'Redeem Now' : 'Payment Required'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {redeemedTickets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Redeemed</h2>
          <div className="space-y-2">
            {redeemedTickets.map((ticket) => (
              <div key={ticket.id} className="xm-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{ticket.product_name}</p>
                    <p className="text-xs text-gray-500">{ticket.ticket_code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      ✓ Redeemed
                    </span>
                    {ticket.redemption_date && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {new Date(ticket.redemption_date).toLocaleDateString()}
                      </p>
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
