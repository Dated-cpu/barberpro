import { getRedis, isRedisAvailable } from './redis';
import { env } from '../config/env';

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

const MEMORY_STORE = new Map<string, number[]>();

function getMemoryStore(key: string): number[] {
  let timestamps = MEMORY_STORE.get(key);
  if (!timestamps) {
    timestamps = [];
    MEMORY_STORE.set(key, timestamps);
  }
  return timestamps;
}

function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, timestamps] of MEMORY_STORE.entries()) {
    const recent = timestamps.filter((t) => now - t < 60000);
    if (recent.length === 0) {
      MEMORY_STORE.delete(key);
    } else if (recent.length !== timestamps.length) {
      MEMORY_STORE.set(key, recent);
    }
  }
}

setInterval(cleanupMemoryStore, 60000);

function memoryRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const cutoff = now - windowMs;
  const timestamps = getMemoryStore(opts.key);

  while (timestamps.length > 0 && timestamps[0]! < cutoff) {
    timestamps.shift();
  }

  if (timestamps.length >= opts.limit) {
    const oldest = timestamps[0]!;
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { success: false, remaining: 0, resetInSeconds };
  }

  timestamps.push(now);
  const remaining = opts.limit - timestamps.length;
  return { success: true, remaining, resetInSeconds: opts.windowSeconds };
}

async function redisRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const cutoff = now - windowMs;
  const redisKey = `ratelimit:${opts.key}`;

  const multi = redis.multi();
  multi.zremrangebyscore(redisKey, 0, cutoff);
  multi.zadd(redisKey, now, `${now}:${Math.random()}`);
  multi.zcard(redisKey);
  multi.expire(redisKey, opts.windowSeconds);

  const results = await multi.exec();
  if (!results) {
    return { success: true, remaining: opts.limit - 1, resetInSeconds: opts.windowSeconds };
  }

  const count = results[2]?.[1] as number | undefined;
  if (count === undefined || count > opts.limit) {
    return { success: false, remaining: 0, resetInSeconds: opts.windowSeconds };
  }

  const remaining = opts.limit - count;
  return { success: true, remaining, resetInSeconds: opts.windowSeconds };
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (env.NODE_ENV === 'production' || isRedisAvailable()) {
    try {
      return await redisRateLimit(opts);
    } catch (err) {
      console.error('[RateLimit] Redis error, falling back to memory:', (err as Error).message);
      return memoryRateLimit(opts);
    }
  }
  return memoryRateLimit(opts);
}
