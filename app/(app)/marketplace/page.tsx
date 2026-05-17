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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-white">Marketplace</h1>
        <span className="text-xs text-[#34D399] font-medium">{listings.length} listings</span>
      </div>

      {/* Action bar */}
      <div className="flex gap-3">
        <a href="/marketplace/create" className="text-sm font-medium transition-all duration-200 hover:opacity-70 active:scale-[0.97]" style={{ color: 'var(--xm-primary)' }}>
          Create Listing →
        </a>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-sm text-[#A1A1AA]">No listings yet</p>
          <p className="text-xs text-[#52525B] mt-2">Be the first to list a card or e-ticket</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing: any) => (
            <div key={listing.id} className="xm-card p-4">
              {/* Top row: tag + price */}
              <div className="flex items-center justify-between mb-3">
                <span className={listing.item_type === 'card' ? 'tag-card' : 'tag-eticket'}>
                  {listing.item_type}
                </span>
                <span className="price-accent text-lg">
                  ${listing.price.toLocaleString()}
                </span>
              </div>

              {/* Image area */}
              <ListingItemImage listing={listing} />

              {/* Divider */}
              <div className="h-px bg-white/[0.06] my-3" />

              {/* Bottom row: seller + buy button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-400 border border-white/10" />
                  <div>
                    <p className="text-xs font-medium text-white">{listing.seller_name}</p>
                    <p className="text-[10px] text-[#52525B]">{listing.seller_number}</p>
                  </div>
                </div>
                {/* Buy button as Apple-style text link */}
                <button className="text-sm font-medium transition-all duration-200 hover:opacity-70 active:scale-[0.97]" style={{ color: 'var(--xm-primary)' }}>
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function ListingItemImage({ listing }: { listing: any }) {
  if (!listing.item_id) {
    return (
      <div className="item-image rounded-xl mb-0">
        <p className="text-xs text-[#52525B]">Item unavailable</p>
      </div>
    );
  }

  try {
    let item: any;

    if (listing.item_type === 'card') {
      const rows = await query(`SELECT * FROM cards WHERE id = $1`, [listing.item_id]);
      item = rows[0] || null;
      if (!item) {
        return (
          <div className="item-image rounded-xl mb-0">
            <p className="text-xs text-[#52525B]">Item unavailable</p>
          </div>
        );
      }
      return (
        <div className="item-image rounded-xl mb-0 flex-col gap-1">
          <span className="text-2xl">🎴</span>
          <p className="text-xs text-white font-medium">{item.product_name}</p>
          <p className="text-[10px] text-[#52525B]">{item.ip} · {item.rarity}</p>
        </div>
      );
    }

    if (listing.item_type === 'eticket') {
      const rows = await query(`SELECT * FROM etickets WHERE id = $1`, [listing.item_id]);
      item = rows[0] || null;
      if (!item) {
        return (
          <div className="item-image rounded-xl mb-0">
            <p className="text-xs text-[#52525B]">Item unavailable</p>
          </div>
        );
      }
      return (
        <div className="item-image rounded-xl mb-0 flex-col gap-1">
          <span className="text-2xl">🎫</span>
          <p className="text-xs text-white font-medium">{item.product_name}</p>
          <p className="text-[10px] text-[#52525B]">{item.ticket_code}</p>
        </div>
      );
    }
  } catch {
    return (
      <div className="item-image rounded-xl mb-0">
        <p className="text-xs text-[#52525B]">Item unavailable</p>
      </div>
    );
  }

  return (
    <div className="item-image rounded-xl mb-0">
      <p className="text-xs text-[#52525B]">Item unavailable</p>
    </div>
  );
}
