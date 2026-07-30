import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    if (!env.REDIS_URL) {
      throw new Error('REDIS_URL is not configured');
    }
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis]', err.message);
    });
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export function isRedisAvailable(): boolean {
  if (!env.REDIS_URL) return false;
  try {
    const r = getRedis();
    return r.status === 'ready' || r.status === 'connect';
  } catch {
    return false;
  }
}
