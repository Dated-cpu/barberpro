import { TRPCError } from '@trpc/server';
import { env } from '../../server/config/env';
import type { Context } from '../context';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export async function checkRateLimit(ctx: Context, key: string): Promise<void> {
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;
  const storeKey = `${key}:${ctx.ip ?? 'unknown'}`;
  const now = Date.now();

  const entry = store.get(storeKey);
  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= maxRequests) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
  }

  entry.count++;
}
