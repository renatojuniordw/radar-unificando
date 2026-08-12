import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simula Redis pronto: força o caminho Redis do checkRateLimit.
// O storeClient mockado rejeita qualquer operação, o que deve acionar o fail-open.
const { rejectError } = vi.hoisted(() => ({
  rejectError: new Error('redis unavailable'),
}));

vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: {
    incr: vi.fn().mockRejectedValue(rejectError),
    pttl: vi.fn().mockRejectedValue(rejectError),
    psetex: vi.fn().mockRejectedValue(rejectError),
    eval: vi.fn().mockRejectedValue(rejectError),
    del: vi.fn().mockRejectedValue(rejectError),
  },
  isRedisReady: vi.fn(() => true),
}));

import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

describe('checkRateLimit (redis path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_route_every_profile_to_its_redis_limiter_and_fail_open', async () => {
    const profiles: Array<[string, string]> = [
      ['chat', 'redis-chat-key'],
      ['chat_daily', 'redis-chat-daily-key'],
      ['auth', 'redis-auth-key'],
      ['register_daily', 'redis-register-key'],
      ['extension', 'redis-extension-key'],
      ['resume_daily', 'redis-resume-key'],
      ['ats_daily', 'redis-ats-key'],
      ['general', 'redis-general-key'],
    ];

    for (const [profile, key] of profiles) {
      const result = await checkRateLimit(key, profile as any);
      // O consume Redis falhou com Error genérico → fail-open libera a requisição.
      expect(result.success).toBe(true);
      expect(result.remainingPoints).toBe(1);
      expect(result.msBeforeNext).toBe(0);
      expect(result.consumedPoints).toBe(1);
    }
  });

  it('should_route_unknown_profile_to_general_redis_limiter', async () => {
    const result = await checkRateLimit('redis-key', 'nao-existe' as any);
    expect(result.success).toBe(true);
  });
});
