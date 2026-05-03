# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Email Cleaner (`artifacts/email-cleaner`)
- **Kind**: Next.js 15 (App Router) + Tailwind CSS v4
- **Auth**: Clerk (`@clerk/nextjs`) — keys in `artifacts/email-cleaner/.env.local`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — claimed dev key
  - Sign-in/up pages at `/sign-in` and `/sign-up`
  - Dashboard at `/dashboard` (protected by `middleware.ts`)
- **Email validation API**: Next.js route handler at `/validate` (avoids conflict with Express `/api`)
- **Plans**: Free (100 emails/upload, localStorage) — Pro (unlimited, UI ready)
- **Stripe**: NOT yet connected. `stripe` and `stripe-replit-sync` packages installed at root.
  - To add Stripe: connect via Replit Integrations tab OR store `STRIPE_SECRET_KEY` as a secret,
    then follow the `stripe` skill to wire up `stripeClient.ts`, `webhookHandlers.ts`, routes, and seed script.
  - Pricing UI exists at `/#pricing` — Pro CTA links to `/sign-up` as placeholder.

### API Server (`artifacts/api-server`)
- **Kind**: Express 5
- **Auth**: Clerk proxy middleware (`@clerk/express`)
- **Routes**: `/api` prefix (Express), `/validate` (Next.js route handler)

## Important Notes

- `.local/skills/clerk-auth/` — do NOT re-provision Clerk; keys are already claimed and working
- Stripe connector ID: `connector:ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y` (not_setup — user dismissed OAuth flow)
- Dashboard stats stored in `localStorage` (keys: `ec_plan`, `ec_total_cleaned`, `ec_total_uploads`, `ec_history`)
