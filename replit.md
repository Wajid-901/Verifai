# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact — standalone)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Email Cleaner (`artifacts/email-cleaner`)
- **Kind**: Next.js 15 (App Router) + Tailwind CSS v4
- **Auth**: Supabase Auth (cookie-based SSR via `@supabase/ssr`)
  - Keys in `artifacts/email-cleaner/.env.local`
    - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
  - Sign-in/up pages at `/sign-in` and `/sign-up` (custom forms, no third-party widget)
  - OAuth callback at `/auth/callback`
  - Dashboard at `/dashboard` (protected by `middleware.ts`)
- **Database**: Supabase Postgres — schema in `supabase/schema.sql`
  - Tables: `profiles` (plan, avatar, name), `uploads` (per-user history)
  - Run `supabase/schema.sql` in Supabase SQL Editor to initialise
- **Email validation**: Next.js route handler at `/validate` (server-side, enforces plan limits)
  - Free plan: 100 emails/upload
  - Pro plan: 100,000 emails/upload + risky-domain flagging
  - Engine: `lib/validation/` (regex → duplicates → risky domains)
- **History API**: Next.js route handler at `/api/history` (GET + POST, auth-gated)
- **Plans**: Free (100 emails/upload) — Pro (unlimited, UI ready, Stripe not yet wired)
- **Stripe**: NOT yet connected.
  - `stripe` and `stripe-replit-sync` packages installed at root.
  - To add Stripe: connect via Replit Integrations tab OR store `STRIPE_SECRET_KEY` as secret,
    then follow the `stripe` skill to wire up `stripeClient.ts`, `webhookHandlers.ts`, routes, and seed script.
  - Pricing UI exists at `/#pricing` — Pro CTA links to `/sign-up` as placeholder.
- **Routing** (artifact.toml paths): `/`, `/api/history`, `/validate`
  - `/api/history` and `/validate` are explicitly claimed so they take priority over api-server's `/api`

### API Server (`artifacts/api-server`)
- **Kind**: Express 5 (standalone, not used by Email Cleaner after Supabase migration)
- **Auth**: Clerk proxy middleware (`@clerk/express`)
- **Routes**: `/api` prefix
- **Note**: Email Cleaner no longer depends on this service.

## Important Notes

- Supabase not available as a Replit managed integration — user must supply their own project keys
- Stripe connector ID: `connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y` (not_setup — user dismissed OAuth flow)
- Upload history stored in Supabase `uploads` table (previously localStorage)
- `lib/db.ts` and `lib/schema.ts` are stubs — do not use; replaced by Supabase client
