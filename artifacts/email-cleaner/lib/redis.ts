import { Redis } from "@upstash/redis";

export interface RedisClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, opts?: { ex?: number }): Promise<any>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

class InMemoryRedis implements RedisClient {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  private cleanup(key: string) {
    const entry = this.store.get(key);
    if (entry?.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.cleanup(key);
    return (this.store.get(key)?.value as T) ?? null;
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<any> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    this.cleanup(key);
    const entry = this.store.get(key);
    const current = typeof entry?.value === "number" ? entry.value : 0;
    const next = current + 1;
    this.store.set(key, { value: next, expiresAt: entry?.expiresAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.cleanup(key);
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }
}

let redisInstance: RedisClient;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisInstance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("⚠️ UPSTASH_REDIS_REST_URL missing. Using in-memory store for Redis. This will NOT work on Vercel.");
  redisInstance = new InMemoryRedis();
}

export const redis = redisInstance;
