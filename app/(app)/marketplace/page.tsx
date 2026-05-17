import { getAuthToken, verifyToken, UserPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token) as UserPayload;

  const listings = await query(`SELECT ml.*, u.display_name as seller_name, u.collector_number as seller_number FROM marketplace_listings ml JOIN users u ON ml.seller_id = u.id WHERE ml.status = 'active' ORDER BY ml.created_at DESC LIMIT 20`);

  const activeListings = (listings as any[]).filter((l: any) => l.status === 'active').length;

  return (
    <div className="xm-container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Marketplace</h1>
        <span className="text-xs text-xm-gold">{listings.length} listings</span>
      </div>

      {/* Action bar */}
      <div className="flex gap-3">
        <a href="/marketplace/create" className="xm-btn-primary text-xs flex-1 text-center">
          Create Listing
        </a>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-sm text-gray-500">No listings yet</p>
          <p className="text-xs text-gray-600 mt-1">Be the first to list a card or e-ticket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: any) => (
            <div key={listing.id} className="xm-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    listing.item_type === 'card' ? 'bg-blue-500/20 text-blue-400' :
                    listing.item_type === 'eticket' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {listing.item_type}
                  </span>
                </div>
                <span className="text-lg font-bold text-xm-gold">
                  ${listing.price.toLocaleString()}
                </span>
              </div>

              {/* Item details from joined data */}
              <ListingItemDetails listing={listing} />

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                <div>
                  <p className="text-xs font-medium">{listing.seller_name}</p>
                  <p className="text-[10px] text-gray-600">{listing.seller_number}</p>
                </div>
                <button className="xm-btn-primary text-xs py-1.5 px-3">Buy Now</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function ListingItemDetails({ listing }: { listing: any }) {
  if (!listing.item_id) return null;

  try {
    let item;

    if (listing.item_type === 'card') {
      const rows = (await query(`SELECT * FROM cards WHERE id = ${listing.item_id}`)) as any[];
      item = rows[0] || null;
      if (!item) return <p className="text-xs text-gray-500">Item unavailable</p>;
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-xm-dark flex items-center justify-center text-xl">🎴</div>
          <div>
            <p className="text-sm font-medium">{item.product_name}</p>
            <p className="text-xs text-gray-500">{item.ip} · {item.rarity}</p>
          </div>
        </div>
      );
    }

    if (listing.item_type === 'eticket') {
      const rows = (await query(`SELECT * FROM etickets WHERE id = ${listing.item_id}`)) as any[];
      item = rows[0] || null;
      if (!item) return <p className="text-xs text-gray-500">Item unavailable</p>;
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-xm-dark flex items-center justify-center text-xl">🎫</div>
          <div>
            <p className="text-sm font-medium">{item.product_name}</p>
            <p className="text-xs text-gray-500">{item.ticket_code}</p>
          </div>
        </div>
      );
    }
  } catch {
    return <p className="text-xs text-gray-500">Error loading item</p>;
  }

  return null;
}
