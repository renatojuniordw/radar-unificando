import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: {
    status: 'ready',
    get: vi.fn(),
    incrbyfloat: vi.fn(),
    expire: vi.fn(),
  },
}));

import { redisClient } from '@/lib/infrastructure/redis/client';
import { classifyBudget, getGlobalBudgetStatus, addGlobalBudgetCost } from '@/lib/infrastructure/redis/global-budget';

describe('classifyBudget', () => {
  it('should_classify_as_normal_when_usage_below_80_percent', () => {
    expect(classifyBudget(0, 1).degraded).toBe(false);
    expect(classifyBudget(0, 1).exhausted).toBe(false);
    expect(classifyBudget(0.79, 1).degraded).toBe(false);
  });

  it('should_classify_as_degraded_between_80_and_100_percent', () => {
    expect(classifyBudget(0.8, 1).degraded).toBe(true);
    expect(classifyBudget(0.8, 1).exhausted).toBe(false);
    expect(classifyBudget(0.99, 1).degraded).toBe(true);
  });

  it('should_classify_as_exhausted_at_or_above_100_percent', () => {
    expect(classifyBudget(1, 1).exhausted).toBe(true);
    expect(classifyBudget(1, 1).degraded).toBe(false);
    expect(classifyBudget(1.5, 1).exhausted).toBe(true);
  });

  it('should_compute_ratio_and_avoid_division_by_zero', () => {
    expect(classifyBudget(0.5, 1).ratio).toBe(0.5);
    expect(classifyBudget(5, 0).ratio).toBe(0);
  });
});

describe('getGlobalBudgetStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClient.status = 'ready';
  });

  it('should_return_zero_usage_when_redis_not_ready', async () => {
    (redisClient as any).status = 'close';
    const status = await getGlobalBudgetStatus();
    expect(status.usedUsd).toBe(0);
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it('should_read_stored_cost_from_redis', async () => {
    vi.mocked(redisClient.get).mockResolvedValue('0.42');
    const status = await getGlobalBudgetStatus();
    expect(status.usedUsd).toBe(0.42);
    expect(redisClient.get).toHaveBeenCalledWith(expect.stringContaining('global_budget:cost:'));
  });

  it('should_treat_missing_key_as_zero', async () => {
    vi.mocked(redisClient.get).mockResolvedValue(null);
    const status = await getGlobalBudgetStatus();
    expect(status.usedUsd).toBe(0);
  });

  it('should_fail_open_when_redis_read_throws', async () => {
    vi.mocked(redisClient.get).mockRejectedValue(new Error('redis down'));
    const status = await getGlobalBudgetStatus();
    expect(status.usedUsd).toBe(0);
    expect(status.exhausted).toBe(false);
  });
});

describe('addGlobalBudgetCost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClient.status = 'ready';
  });

  it('should_skip_when_redis_not_ready', async () => {
    (redisClient as any).status = 'close';
    await addGlobalBudgetCost(0.01);
    expect(redisClient.incrbyfloat).not.toHaveBeenCalled();
  });

  it('should_skip_when_cost_is_zero_or_negative', async () => {
    await addGlobalBudgetCost(0);
    await addGlobalBudgetCost(-1);
    expect(redisClient.incrbyfloat).not.toHaveBeenCalled();
  });

  it('should_increment_and_set_expiry', async () => {
    vi.mocked(redisClient.incrbyfloat).mockResolvedValue('0.01');
    vi.mocked(redisClient.expire).mockResolvedValue(1);
    await addGlobalBudgetCost(0.01);
    expect(redisClient.incrbyfloat).toHaveBeenCalledWith(expect.stringContaining('global_budget:cost:'), 0.01);
    expect(redisClient.expire).toHaveBeenCalledWith(expect.stringContaining('global_budget:cost:'), 2 * 24 * 60 * 60);
  });

  it('should_swallow_redis_errors', async () => {
    vi.mocked(redisClient.incrbyfloat).mockRejectedValue(new Error('redis down'));
    await expect(addGlobalBudgetCost(0.01)).resolves.toBeUndefined();
  });
});