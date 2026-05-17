import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminETickets() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const tickets = await sql`
    SELECT et.*, u.display_name as owner_name, u.collector_number as owner_number
    FROM etickets et LEFT JOIN users u ON et.owner_id = u.id
    ORDER BY et.created_at DESC
  `;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">E-Ticket Management</h1>

      <div className="bg-xm-card rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="p-3 text-xs text-gray-500">Code</th>
              <th className="p-3 text-xs text-gray-500">Product</th>
              <th className="p-3 text-xs text-gray-500">Owner</th>
              <th className="p-3 text-xs text-gray-500">Payment</th>
              <th className="p-3 text-xs text-gray-500">Status</th>
              <th className="p-3 text-xs text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {(tickets as any[]).map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-800/50 hover:bg-xm-dark/50">
                <td className="p-3 text-xs text-xm-gold font-mono">{ticket.ticket_code}</td>
                <td className="p-3 text-xs">{ticket.product_name}</td>
                <td className="p-3 text-xs">
                  {ticket.owner_name || <span className="text-gray-600">—</span>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ticket.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    ticket.payment_status === 'reserved' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{ticket.payment_status}</span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ticket.status === 'redeemed' ? 'bg-green-500/20 text-green-400' :
                    ticket.status === 'active' ? 'bg-xm-gold/20 text-xm-gold' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{ticket.status}</span>
                </td>
                <td className="p-3 text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
