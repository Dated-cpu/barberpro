import { TRPCError } from '@trpc/server';
import { rateLimit } from '@/server/security/rate-limit';

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async ({ ctx }: { ctx: { ip?: string; user?: { id: string } | null } }) => {
    const ip = ctx.ip ?? 'unknown';
    const userId = ctx.user?.id ?? 'anon';
    const key = `${config.key}:${userId}:${ip}`;

    const result = await rateLimit({
      key,
      limit: config.limit,
      windowSeconds: config.windowSeconds,
    });

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Слишком много запросов. Попробуйте через ${result.resetInSeconds} секунд`,
      });
    }

    return result;
  };
}
