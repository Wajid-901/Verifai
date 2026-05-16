import { promises as dns } from "dns";

interface MXCacheEntry {
  hasMX: boolean;
  timedOut: boolean;
  timestamp: number;
}

const MX_CACHE = new Map<string, MXCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MX_TIMEOUT_MS = 5_000;

export interface MXResult {
  hasMX: boolean;
  timedOut: boolean;
  reason?: string;
}

export async function checkMX(domain: string): Promise<MXResult> {
  const cached = MX_CACHE.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      hasMX: cached.hasMX,
      timedOut: cached.timedOut,
      reason: cached.hasMX ? undefined : "No mail server found",
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
    const entry: MXCacheEntry = { hasMX, timedOut: false, timestamp: Date.now() };
    MX_CACHE.set(domain, entry);
    return { hasMX, timedOut: false, reason: hasMX ? undefined : "No mail server found" };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "mx_timeout";
    const entry: MXCacheEntry = { hasMX: true, timedOut, timestamp: Date.now() };
    MX_CACHE.set(domain, entry);
    return { hasMX: true, timedOut, reason: undefined };
  }
}

export async function checkMXBatch(domains: string[]): Promise<Map<string, MXResult>> {
  const results = new Map<string, MXResult>();
  await Promise.allSettled(
    domains.map(async (domain) => {
      const result = await checkMX(domain);
      results.set(domain, result);
    })
  );
  return results;
}
