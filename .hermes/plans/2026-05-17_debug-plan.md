# Debug Plan: XM Passport Vercel Deployment

## Goal
Make the concept site fully functional on Vercel — demo user sees vault, profile, marketplace, etc. without any server errors.

## Current State
- Home page loads (empty data)
- `/api/profile` returns 500
- Vault and profile pages crash on SSR
- PWA icons missing (cosmetic)
- `@neondatabase/serverless` works locally (tested: tagged templates + .query() both pass)

## Root Cause Hypothesis

The issue is specific to Vercel's serverless runtime. Possible causes:
1. **`ensureNeon()` returns a new connection on every Lambda cold-start** — but the `initialized` flag resets per-instance
2. **`migrate()` runs on every cold start** — the `_migrations` table might have data but `versionRows[0]` access fails due to Neon's type system
3. **The `initialized` flag is module-level** — Vercel may reuse module state across requests inconsistently

## Proposed Fix Strategy

### Phase 1: Simplify the DB module — no `sql` function, no `query()` wrapper

Replace `lib/db.ts` entirely with a direct `pg` connection pool using `pg` package:
- Simple connect/query/disconnect pattern
- No Proxy, no tagged template wrapper, no `neon()` complexity
- Well-tested on Vercel

### Phase 2: Seed via API endpoint instead of on-first-query

Move DB seeding to a dedicated `/api/setup` endpoint that's called once:
- Call it manually after deploy
- Avoids blocking the first request with migration work
- Clear failure isolation

### Phase 3: Fix remaining issues

- Generate PWA placeholder icons
- Ensure demo user JWT matches seeded user
- Test all pages

## Files to Change

| File | Change |
|------|--------|
| `lib/db.ts` | Replace `@neondatabase/serverless` with `pg` (node-postgres) |
| `package.json` | Remove `@neondatabase/serverless`, add `pg` |
| `app/api/setup/route.ts` | New: seed data endpoint |
| `public/icons/` | Add placeholder PNG icons |

## Step-by-step

1. Install `pg` package, remove `@neondatabase/serverless`
2. Rewrite `lib/db.ts`:
   - Export `query()` that connects, runs SQL, disconnects (simple pool-less pattern for serverless)
   - No module-level state, no `initialized` flag
   - Auto-migrate on each `query()` call (check `_migrations` table)
   - Auto-seed only on explicit `/api/setup` call
3. Create `/api/setup/route.ts` — runs migrate + seed, returns status
4. Create placeholder PWA icons
5. Deploy, call `/api/setup`, verify

## Verification

1. Visit `https://xm-passport.vercel.app/api/setup` — should return `{"status":"ok"}`
2. Visit home page — should show demo user data
3. Click vault — should show 25 cards
4. Click profile — should load without error
5. Click marketplace — should show 4 listings

## Risks

- `pg` requires native compilation — but Vercel supports it natively on Lambda
- Connection overhead on each request — but Neon's serverless handles this fine
- No connection pooling — but for a concept site with low traffic this is fine
