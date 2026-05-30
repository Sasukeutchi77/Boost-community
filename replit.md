# Boost Community

Application mobile de croissance TikTok : les créateurs accomplissent des missions (watch, like, comment, follow, share) pour gagner des coins et monter dans le classement.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with initial missions, achievements, campaigns
- `pnpm run typecheck` — full typecheck across all packages

Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)
Required env: `SESSION_SECRET` — JWT signing secret (set in Replit Secrets)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Mobile: Expo SDK 54, React Native 0.81.5, expo-router v6
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod validators)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for ALL API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod validators (do not edit)
- `lib/db/src/schema/index.ts` — Drizzle DB schema (users, missions, campaigns, coins, achievements, tickets)
- `artifacts/api-server/src/routes/` — Express routes (auth, users, dashboard, missions, campaigns, coins, leaderboard, achievements, tickets, referrals)
- `artifacts/boost-community-expo/app/` — Expo Router screens
- `artifacts/boost-community-expo/context/AuthContext.tsx` — JWT auth state
- `artifacts/boost-community-expo/constants/colors.ts` — dark theme color system

## Architecture decisions

- Contract-first API: OpenAPI spec defines the contract; codegen produces typed hooks for the mobile app and Zod validators for the server
- JWT stored in AsyncStorage (no native keychain dependency for Expo Go compatibility)
- `setBaseUrl` + `setAuthTokenGetter` set at module level in `app/_layout.tsx` (outside any React component) so they run before any hook is called
- Dark-only theme — `userInterfaceStyle: "dark"` in app.json, Colors object is flat (not light/dark split) since the app is dark-only
- NativeTabs (iOS 26 liquid glass) with ClassicTabLayout fallback

## Product

- Auth: register / login / forgot-password
- Dashboard: XP progress, rank badge, stats (missions completed, active campaigns, coins earned), quick actions, activity feed
- Missions: filter by type (watch/like/comment/follow/share), complete missions to earn coins + XP
- Campaigns: browse active campaigns, view your own campaigns
- Leaderboard: top creators ranked by XP, your rank card
- Profile: avatar, rank, level, XP bar, coins, streak, referral stats, support link, logout
- Coins: balance, transaction history with type icons
- Achievements: progress bars, unlock status
- Support: ticket creation and history

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after updating `openapi.yaml` before editing screen files that use generated hooks
- Never change the `info.title` in `openapi.yaml` — it controls generated filenames (`api.ts`)
- The `lib/api-zod/src/index.ts` uses `export * as ZodTypes from "./generated/types"` to avoid name conflicts with Zod schema exports
- The seed script (`scripts/src/seed.ts`) is idempotent — safe to run multiple times

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/expo/SKILL.md` for Expo-specific guidelines
