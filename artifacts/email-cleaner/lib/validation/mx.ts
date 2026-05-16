import { promises as dns } from "dns";

interface MXCacheEntry {
  hasMX: boolean;
  timedOut: boolean;
  timestamp: number;
}

const MX_CACHE = new Map<string, MXCacheEntry>();
const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 min
const MX_TIMEOUT_MS = 5_000;           // 5 s per lookup
const BATCH_CONCURRENCY = 20;          // max parallel DNS calls

export interface MXResult {
  hasMX: boolean;
  timedOut: boolean;
  reason?: string;
}

export function getCacheStats() {
  return { size: MX_CACHE.size };
}

export function clearMXCache() {
  MX_CACHE.clear();
}

export async function checkMX(domain: string): Promise<MXResult> {
  const cached = MX_CACHE.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      hasMX:    cached.hasMX,
      timedOut: cached.timedOut,
      reason:   cached.hasMX ? undefined : "No mail server found",
    };
  }

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("mx_timeout")), MX_TIMEOUT_MS)
      ),
    ]);

    const hasMX = Array.isArray(records) && records.length > 0;
    MX_CACHE.set(domain, { hasMX, timedOut: false, timestamp: Date.now() });
    return { hasMX, timedOut: false, reason: hasMX ? undefined : "No mail server found" };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "mx_timeout";
    // On timeout or NXDOMAIN-like errors, fail open (assume valid) to avoid false negatives
    MX_CACHE.set(domain, { hasMX: true, timedOut, timestamp: Date.now() });
    return { hasMX: true, timedOut, reason: undefined };
  }
}

/**
 * Batch MX check with bounded concurrency — prevents DNS resolver overload
 * when processing large lists (thousands of unique domains).
 */
export async function checkMXBatch(
  domains: string[],
  onBatchDone?: (checked: number, total: number) => void,
): Promise<Map<string, MXResult>> {
  const results = new Map<string, MXResult>();
  let checked = 0;

  for (let i = 0; i < domains.length; i += BATCH_CONCURRENCY) {
    const batch = domains.slice(i, i + BATCH_CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (domain) => {
        const result = await checkMX(domain);
        results.set(domain, result);
      })
    );
    checked += batch.length;
    onBatchDone?.(checked, domains.length);
  }

  return results;
}
