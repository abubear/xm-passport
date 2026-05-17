# Design Implementation Plan: XM Passport

## Problems with Current Implementation

1. **Two navigation bars** — TopNav has pill nav tabs (Home/Vault/Drops/Market) AND BottomNav has the same items. Should be ONE nav: bottom nav only. Top bar should be purely branding + utilities.
2. **Card design wrong** — Current cards are generic. Screenshot shows: category tag (eticket/card pill), image area, price in accent color, divider, seller info + Buy Now button.
3. **Colors** — Design uses #030303 background, #18181B cards, #34D399 green accent. Current is close but needs refinement.
4. **Layout** — Too wide. Should be constrained to mobile-like column.

## Files to Change

| File | Change |
|------|--------|
| `components/ui/TopNav.tsx` | Remove pill nav tabs. Only XM logo + "Collector" on left, bell + avatar on right. No navigation links. |
| `components/ui/BottomNav.tsx` | Ensure 5 items: Home, Vault, Scan (center, prominent), Market, Profile. Active state = white icon/label. |
| `app/globals.css` | Add card design tokens matching screenshot (category pill, image placeholder, divider style, price accent) |
| `app/(app)/marketplace/page.tsx` | Redesign listing cards to match: category tag pill, image area (or "Item unavailable"), price (accent color), divider, seller info + Buy Now |

## Design Spec (from MD + screenshot)

### Base
- Background: `#030303`
- Cards: `#18181B` with 16px radius, 1px `rgba(255,255,255,0.08)` border
- Surface: `#09090B`
- Text primary: `#FFFFFF`
- Text secondary: `#A1A1AA`

### Accent Colors
- Primary accent: `#34D399` (green — used for prices, active nav items, ratings)
- Blue: `#60A5FA` (card tag, info)
- Purple: for eticket tags

### Typography
- Body: DM Sans or Inter
- Stats/Labels: uppercase, tracking-wider, `#A1A1AA`
- Prices: `#34D399`, semibold

### Bottom Nav
- 5 items: Home, Vault, Scan (center circle, gold/green), Market, Profile
- Inactive: `#52525B` icons + labels
- Active: white icons + labels

### Card Layout (Marketplace)
```
┌─────────────────────────────┐
│ [eticket]           $1,599 │  ← category pill + price (accent)
│                             │
│    [image placeholder]      │  ← rounded image area
│    Item unavailable         │
│                             │
│ ──────────────────────────  │  ← thin divider
│ Demo Collector              │
│ XM-DEMO01       [Buy Now]  │  ← seller info + pill button
└─────────────────────────────┘
```

## Steps

1. Simplify TopNav — remove all nav links
2. Keep BottomNav as-is (already 5 items)
3. Add CSS classes for marketplace card parts (tag pill, image area, etc.)
4. Redesign marketplace page listing cards to match screenshot layout
5. Ensure proper mobile-first centering
6. Deploy and verify
