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

### Verifai (`artifacts/email-cleaner`)
- **Kind**: Next.js 15 (App Router) + Tailwind CSS v4
- **Auth**: Supabase Auth (cookie-based SSR via `@supabase/ssr`)
  - Keys in `artifacts/email-cleaner/.env.local`
    - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
  - Sign-in/up pages at `/sign-in` and `/sign-up` (custom forms, no third-party widget)
  - OAuth callback at `/auth/callback`
  - Dashboard at `/dashboard` (protected by `middleware.ts`)
- **Database**: Supabase Postgres — schema in `supabase/schema.sql`
  - Tables: `profiles` (plan, avatar, name), `uploads` (per-user history), `subscriptions`
  - Run `supabase/schema.sql` in Supabase SQL Editor to initialise
- **Email validation**: 7-step async pipeline
  - `POST /validate` → returns `{ jobId }` immediately (202)
  - `GET /validate/status/[jobId]` → polls job progress (0–100) + final result
  - Engine: `lib/validation/` (syntax → dedup → disposable → role-based → domain → MX → scoring)
  - MX lookups: batched at 20 concurrent, 5s timeout, 10-min module-level cache
- **History API**: Next.js route handler at `/api/history` (GET + POST, auth-gated)
- **Plans**: `lib/plans.ts` — centralized config (free/pro/anonymous limits)
  - Free: 100 emails/upload, 25 validations/day
  - Pro: 100k emails/upload, 500 validations/day
- **Rate limiting**: `lib/rate-limit.ts` — in-memory sliding window
  - Anonymous: 5/hour per IP
  - Free: 25/day per user ID
  - Pro: 500/day per user ID
  - Swap store for Upstash Redis for multi-instance deployments
- **Background jobs**: `lib/jobs.ts` — in-memory job store, 10-min TTL, 1000 job cap
  - Architecture ready for Redis/queue backend swap
- **Logging**: `lib/logger.ts` — structured JSON logs (info/warn/error)
- **Security headers**: `next.config.ts` — CSP, X-Frame-Options, HSTS, etc.
- **Stripe**: NOT yet connected.
  - Architecture types in `lib/stripe/types.ts`
  - `stripe` and `stripe-replit-sync` packages installed at root.
  - To add Stripe: store `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` as secrets,
    then follow the `stripe` skill to wire up `stripeClient.ts`, `webhookHandlers.ts`, routes, and seed script.
  - Pricing UI exists at `/#pricing` — Pro CTA links to `/sign-up` as placeholder.
- **Routing** (artifact.toml paths): `/`, `/api/history`, `/validate`
  - `/api/history` and `/validate` are explicitly claimed so they take priority over api-server's `/api`

### API Server (`artifacts/api-server`)
- **Kind**: Express 5 (standalone, not used by Verifai after Supabase migration)
- **Auth**: Clerk proxy middleware (`@clerk/express`)
- **Routes**: `/api` prefix
- **Note**: Verifai no longer depends on this service.

## Important Notes

- Supabase not available as a Replit managed integration — user must supply their own project keys
- Stripe connector ID: `connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y` (not_setup — user dismissed OAuth flow)
- Upload history stored in Supabase `uploads` table
- `lib/db.ts` and `lib/schema.ts` are stubs — do not use; replaced by Supabase client
- In-memory rate limiter and job store work correctly on Replit's persistent Node.js process;
  for multi-instance/serverless deploys, swap for Upstash Redis
