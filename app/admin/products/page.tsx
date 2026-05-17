import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button className="xm-btn-primary text-xs">Add Product</button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No products yet</div>
      ) : (
        <div className="space-y-3">
          {(products as any[]).map((product) => (
            <div key={product.id} className="bg-xm-card rounded-xl border border-gray-800 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.ip} · {product.product_type}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  product.status === 'preorder' ? 'bg-green-500/20 text-green-400' :
                  product.status === 'announced' ? 'bg-xm-gold/20 text-xm-gold' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{product.status}</span>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Edition: {product.edition_size || 'N/A'}</span>
                <span>Price: ${product.price?.toLocaleString() || 'N/A'}</span>
                <span>E-Ticket: {product.e_ticket_enabled ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
