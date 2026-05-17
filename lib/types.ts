export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  display_name: string;
  auth_provider: AuthProvider;
  provider_id: string | null;
  wechat_unionid: string | null;
  collector_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  collection_prefs: string;   // JSON array of IPs/genres
  public_profile: number;
  social_links: string;        // JSON {instagram, twitter, youtube, website}
  language: string;             // 'en', 'zh-CN', 'zh-TW'
  total_points: number;
  rank: Rank;
  rank_points: number;
  collection_count: number;
  verified_collector: number;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export type AuthProvider = 'email' | 'phone' | 'apple' | 'google' | 'wechat';

export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'master';

export interface Card {
  id: string;
  card_code: string;
  product_name: string;
  ip: string | null;
  edition: string | null;
  edition_size: number | null;
  edition_number: number | null;
  rarity: Rarity;
  card_type: string;
  image_url: string | null;
  owner_id: string | null;
  status: string;
  scanned_at: string | null;
  points_value: number;
  created_at: string;
}

export type Rarity = 'common' | 'rare' | 'ultra-rare' | 'legendary';

export interface ETicket {
  id: string;
  ticket_code: string;
  product_id: string;
  product_name: string;
  owner_id: string | null;
  status: string;
  payment_status: string;
  purchase_price: number | null;
  redemption_date: string | null;
  expiry_date: string | null;
  points_earned: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  ip: string | null;
  description: string | null;
  product_type: string;
  edition_size: number | null;
  price: number | null;
  image_url: string | null;
  release_date: string | null;
  status: string;
  e_ticket_enabled: number;
  created_at: string;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  item_type: 'card' | 'eticket' | 'collectible';
  item_id: string;
  price: number;
  currency: string;
  status: string;
  buyer_id: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface CollectionJourney {
  id: string;
  name: string;
  description: string | null;
  ip: string | null;
  required_items: string; // JSON array
  reward_points: number;
  reward_rank_boost: number;
  badge_url: string | null;
  created_at: string;
}

export interface UserJourney {
  id: string;
  user_id: string;
  journey_id: string;
  progress: string; // JSON object
  completed: number;
  completed_at: string | null;
  created_at: string;
}

export const RANK_THRESHOLDS: Record<Rank, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
  master: 10000,
};

export const RANK_NAMES: Record<Rank, string> = {
  bronze: 'Bronze Collector',
  silver: 'Silver Collector',
  gold: 'Gold Collector',
  platinum: 'Platinum Collector',
  master: 'Master Collector',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#a8a8a8',
  rare: '#4a90d9',
  'ultra-rare': '#9b59b6',
  legendary: '#c8a95a',
};

export const RARITY_POINTS: Record<Rarity, number> = {
  common: 100,
  rare: 300,
  'ultra-rare': 500,
  legendary: 1000,
};
