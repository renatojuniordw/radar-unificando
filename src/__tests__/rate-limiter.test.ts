import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter, pipelineAutoLimiter } from '@/lib/infrastructure/security/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_allow_first_request', () => {
    const limiter = new RateLimiter(60_000, 5);
    const result = limiter.check('key-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should_allow_requests_within_limit', () => {
    const limiter = new RateLimiter(60_000, 3);
    limiter.check('key-1');
    limiter.check('key-1');
    const result = limiter.check('key-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should_block_requests_exceeding_limit', () => {
    const limiter = new RateLimiter(60_000, 3);
    limiter.check('key-1');
    limiter.check('key-1');
    limiter.check('key-1');
    const result = limiter.check('key-1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should_reset_window_after_expiry', () => {
    const limiter = new RateLimiter(60_000, 2);
    limiter.check('key-1');
    limiter.check('key-1');
    expect(limiter.check('key-1').allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    const result = limiter.check('key-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should_track_multiple_keys_independently', () => {
    const limiter = new RateLimiter(60_000, 2);
    limiter.check('key-a');
    limiter.check('key-b');
    expect(limiter.check('key-a').allowed).toBe(true);
    expect(limiter.check('key-a').allowed).toBe(false);
    expect(limiter.check('key-b').allowed).toBe(true);
  });

  it('should_return_correct_reset_at_timestamp', () => {
    const limiter = new RateLimiter(60_000, 3);
    const result = limiter.check('key-1');
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('should_not_return_negative_remaining', () => {
    const limiter = new RateLimiter(60_000, 1);
    limiter.check('key-1');
    limiter.check('key-1');
    limiter.check('key-1');
    const result = limiter.check('key-1');
    expect(result.remaining).toBe(0);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should_create_new_entry_for_expired_key', () => {
    const limiter = new RateLimiter(60_000, 2);
    limiter.check('key-1');
    vi.advanceTimersByTime(60_001);
    const result = limiter.check('key-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('pipeline_auto_limiter_permite_2_por_janela_e_bloqueia_3o', () => {
    const key = `auto-test-${Date.now()}-${Math.random()}`;
    expect(pipelineAutoLimiter.windowMs).toBe(300_000);
    expect(pipelineAutoLimiter.check(key).allowed).toBe(true);
    expect(pipelineAutoLimiter.check(key).allowed).toBe(true);
    expect(pipelineAutoLimiter.check(key).allowed).toBe(false);
  });
});
