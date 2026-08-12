import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocka rate-limiter-flexible para controlar o objeto de rejeição (RateLimiterRes)
// e validar a propagação dos campos no caso de limite excedido.
const { consumeMock } = vi.hoisted(() => ({ consumeMock: vi.fn() }));

vi.mock('rate-limiter-flexible', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rate-limiter-flexible')>();
  return {
    ...actual,
    RateLimiterRes: class RateLimiterRes {
      remainingPoints = 0;
      msBeforeNext = 60000;
      consumedPoints = 0;
      constructor(opts: Partial<RateLimiterRes> = {}) {
        Object.assign(this, opts);
      }
    },
    RateLimiterMemory: class {
      consume = consumeMock;
    },
    RateLimiterRedis: class {
      consume = consumeMock;
    },
  };
});

import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { RateLimiterRes } from 'rate-limiter-flexible';

describe('checkRateLimit (rate limiter rejection contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_propagate_rejection_fields_when_rate_limited', async () => {
    consumeMock.mockRejectedValue(new RateLimiterRes({ remainingPoints: 3, msBeforeNext: 5000, consumedPoints: 2 }));
    const result = await checkRateLimit('limit-key', 'chat');
    expect(result.success).toBe(false);
    expect(result.remainingPoints).toBe(3);
    expect(result.msBeforeNext).toBe(5000);
    expect(result.consumedPoints).toBe(2);
  });

  it('should_default_rejection_fields_when_they_are_missing', async () => {
    consumeMock.mockRejectedValue(new RateLimiterRes({ remainingPoints: 0 }));
    const result = await checkRateLimit('limit-key', 'chat');
    expect(result.success).toBe(false);
    expect(result.remainingPoints).toBe(0);
    expect(result.msBeforeNext).toBe(60000);
    expect(result.consumedPoints).toBe(0);
  });
});
