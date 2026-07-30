import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimit } from '../../src/server/security/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', async () => {
    const result = await rateLimit({
      key: 'test:basic',
      limit: 5,
      windowSeconds: 60,
    });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetInSeconds).toBe(60);
  });

  it('should block requests exceeding limit', async () => {
    const key = 'test:block';

    for (let i = 0; i < 3; i++) {
      const result = await rateLimit({ key, limit: 3, windowSeconds: 60 });
      if (i < 2) {
        expect(result.success).toBe(true);
      }
    }

    const blocked = await rateLimit({ key, limit: 3, windowSeconds: 60 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });

  it('should reset after window expires', async () => {
    const key = 'test:reset';

    for (let i = 0; i < 2; i++) {
      await rateLimit({ key, limit: 2, windowSeconds: 5 });
    }

    const blocked = await rateLimit({ key, limit: 2, windowSeconds: 5 });
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(6000);

    const allowed = await rateLimit({ key, limit: 2, windowSeconds: 5 });
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(1);
  });

  it('should have independent counters for different keys', async () => {
    const resultA = await rateLimit({ key: 'test:keyA', limit: 1, windowSeconds: 60 });
    expect(resultA.success).toBe(true);

    const resultB = await rateLimit({ key: 'test:keyB', limit: 1, windowSeconds: 60 });
    expect(resultB.success).toBe(true);

    const blockedA = await rateLimit({ key: 'test:keyA', limit: 1, windowSeconds: 60 });
    expect(blockedA.success).toBe(false);

    const resultB2 = await rateLimit({ key: 'test:keyB', limit: 1, windowSeconds: 60 });
    expect(resultB2.success).toBe(false);
  });

  it('should decrement remaining on each request', async () => {
    const key = 'test:decrement';

    const r1 = await rateLimit({ key, limit: 5, windowSeconds: 60 });
    expect(r1.remaining).toBe(4);

    const r2 = await rateLimit({ key, limit: 5, windowSeconds: 60 });
    expect(r2.remaining).toBe(3);

    const r3 = await rateLimit({ key, limit: 5, windowSeconds: 60 });
    expect(r3.remaining).toBe(2);
  });

  it('should handle high limit values', async () => {
    const key = 'test:high';

    for (let i = 0; i < 100; i++) {
      const r = await rateLimit({ key, limit: 100, windowSeconds: 60 });
      if (!r.success) {
        expect(r.success).toBe(true);
        break;
      }
    }

    const blocked = await rateLimit({ key, limit: 100, windowSeconds: 60 });
    expect(blocked.success).toBe(false);
  });

  it('should handle empty keys gracefully', async () => {
    const r = await rateLimit({ key: 'test:empty', limit: 0, windowSeconds: 60 });
    expect(r.success).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it('should work with 1-second window', async () => {
    const key = 'test:burst';

    const r1 = await rateLimit({ key, limit: 1, windowSeconds: 1 });
    expect(r1.success).toBe(true);

    const r2 = await rateLimit({ key, limit: 1, windowSeconds: 1 });
    expect(r2.success).toBe(false);

    vi.advanceTimersByTime(1500);

    const r3 = await rateLimit({ key, limit: 1, windowSeconds: 1 });
    expect(r3.success).toBe(true);
  });
});
