import { describe, it, expect, vi } from 'vitest';

// Redis mockado como indisponível → checkRateLimit cai no fallback RateLimiterMemory
// sem disparar o connect assíncrono do client real (que causava race no teardown).
vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: {
    status: 'close',
    get: vi.fn(),
    incrbyfloat: vi.fn(),
    expire: vi.fn(),
  },
  isRedisReady: vi.fn(() => false),
}));

import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

describe('checkRateLimit (memory fallback)', () => {
  it('should_allow_first_request_within_limit', async () => {
    const testIp = `192.168.1.${Math.floor(Math.random() * 1000)}`;
    const result = await checkRateLimit(testIp, 'chat');
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBeGreaterThanOrEqual(0);
  });

  it('should_reject_requests_over_the_auth_limit_of_five', async () => {
    const testIp = `10.0.0.${Math.floor(Math.random() * 1000 + 100)}`;

    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(testIp, 'auth');
      expect(res.success).toBe(true);
    }

    const blockedRes = await checkRateLimit(testIp, 'auth');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remainingPoints).toBe(0);
  });

  it('should_reject_requests_over_the_ats_daily_limit_of_ten', async () => {
    const testIp = `172.16.0.${Math.floor(Math.random() * 1000)}`;

    for (let i = 0; i < 10; i++) {
      const res = await checkRateLimit(testIp, 'ats_daily');
      expect(res.success).toBe(true);
    }

    const blockedRes = await checkRateLimit(testIp, 'ats_daily');
    expect(blockedRes.success).toBe(false);
  });

  it('should_allow_first_request_for_register_daily_extension_and_resume_daily_profiles', async () => {
    const base = Math.floor(Math.random() * 100000);
    const register = await checkRateLimit(`reg-${base}`, 'register_daily');
    const extension = await checkRateLimit(`ext-${base}`, 'extension');
    const resume = await checkRateLimit(`resume-${base}`, 'resume_daily');
    const general = await checkRateLimit(`gen-${base}`, 'general');
    const chatDaily = await checkRateLimit(`chatd-${base}`, 'chat_daily');
    expect(register.success).toBe(true);
    expect(extension.success).toBe(true);
    expect(resume.success).toBe(true);
    expect(general.success).toBe(true);
    expect(chatDaily.success).toBe(true);
  });

  it('should_support_composite_keys_of_user_id_and_ip', async () => {
    const compositeKey = `user_12345:192.168.1.50`;
    const result = await checkRateLimit(compositeKey, 'chat');
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBeGreaterThanOrEqual(0);
  });

  it('should_use_only_first_segment_of_key_before_comma', async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200)}`;

    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(`${ip}, extra-${i}`, 'auth');
      expect(res.success).toBe(true);
    }

    // Mesma chave limpa (ip) com sufixo diferente → limite de auth (5) já esgotado.
    const blockedRes = await checkRateLimit(`${ip}, outroparam`, 'auth');
    expect(blockedRes.success).toBe(false);
  });

  it('should_use_default_ip_when_key_is_blank', async () => {
    const result = await checkRateLimit('   ', 'chat');
    expect(result.success).toBe(true);
  });
});
