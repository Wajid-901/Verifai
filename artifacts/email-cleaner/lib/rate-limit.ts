/**
 * In-memory sliding-window rate limiter.
 * Works correctly on Replit's persistent Node.js process.
 * For multi-instance/serverless deployments, swap the store for Redis (Upstash).
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Evict expired keys periodically to prevent unbounded growth
let lastEvict = Date.now();
function evictExpired() {
  if (Date.now() - lastEvict < 60_000) return;
  lastEvict = Date.now();
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  evictExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

export function getClientIP(req: Request): string {
  const fwd = (req.headers as Headers).get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

// Pre-defined limit tiers (see lib/plans.ts for plan config)
export const RATE_LIMITS = {
  anonymous_validate:   { maxRequests: 5,   windowMs: 60 * 60 * 1000 },      // 5/hour
  free_validate:        { maxRequests: 25,  windowMs: 24 * 60 * 60 * 1000 }, // 25/day
  pro_validate:         { maxRequests: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500/day
  anonymous_history:    { maxRequests: 0,   windowMs: 1 },                   // blocked
  free_history:         { maxRequests: 200, windowMs: 24 * 60 * 60 * 1000 }, // 200/day
} as const;
