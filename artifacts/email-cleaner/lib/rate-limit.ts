import { redis } from "./redis";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }

  if (currentCount > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  return { allowed: true, remaining: config.maxRequests - currentCount };
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
