import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DropsPage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const products = await sql`SELECT * FROM products WHERE status IN ('announced', 'preorder') ORDER BY created_at DESC` as Product[];

  return (
    <div className="xm-container py-6 space-y-6">
      <h1 className="text-xl font-bold">Drops</h1>
      <p className="text-sm text-gray-500">Upcoming and available statue pre-orders</p>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-sm text-gray-500">No drops available</p>
          <p className="text-xs text-gray-600 mt-1">Check back for upcoming releases</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="xm-card">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-xm-dark flex items-center justify-center text-3xl flex-shrink-0">
                  🗿
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      product.status === 'preorder' ? 'bg-green-500/20 text-green-400' : 'bg-xm-gold/20 text-xm-gold'
                    }`}>
                      {product.status}
                    </span>
                    {product.ip && (
                      <span className="text-[10px] text-gray-500">{product.ip}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-xm-gold">
                      ${product.price?.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {product.e_ticket_enabled && (
                        <button className="xm-btn-primary text-xs py-1.5 px-3">
                          Reserve E-Ticket
                        </button>
                      )}
                    </div>
                  </div>
                  {product.edition_size && (
                    <p className="text-[10px] text-gray-600 mt-1">Edition of {product.edition_size}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
