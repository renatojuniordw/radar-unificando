import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  chatRepository: {
    getDailyUserMessageCount: vi.fn(),
    sumTokensSince: vi.fn(),
  },
}));
vi.mock('@/lib/infrastructure/redis/global-budget', () => ({
  getGlobalBudgetStatus: vi.fn(),
}));

import { chatRepository } from '@/lib/infrastructure/repositories';
import { getGlobalBudgetStatus } from '@/lib/infrastructure/redis/global-budget';
import { GET } from '@/app/api/chat/usage/route';

describe('Chat Usage API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(chatRepository.getDailyUserMessageCount).mockResolvedValue(5);
    vi.mocked(chatRepository.sumTokensSince).mockResolvedValue({ totalTokens: 1000 } as any);
    vi.mocked(getGlobalBudgetStatus).mockResolvedValue({
      usedUsd: 1.5,
      limitUsd: 10,
      ratio: 0.15,
      degraded: false,
      exhausted: false,
    } as any);
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('should_return_usage_summary', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(5);
    expect(body.limit).toBe(50);
    expect(body.remaining).toBe(45);
    expect(body.isDailyLimitReached).toBe(false);
    expect(body.dailyTokens).toBe(1000);
    expect(body.dailyTokenRemaining).toBe(99000);
    expect(body.monthlyTokens).toBe(1000);
    expect(body.isTokenLimitReached).toBe(false);
    expect(body.globalBudget.usedUsd).toBe(1.5);
    expect(body.globalBudget.exhausted).toBe(false);
  });

  it('should_flag_limits_when_reached', async () => {
    vi.mocked(chatRepository.getDailyUserMessageCount).mockResolvedValue(50);
    vi.mocked(chatRepository.sumTokensSince).mockResolvedValue({ totalTokens: 100000 } as any);
    const res = await GET();
    const body = await res.json();
    expect(body.isDailyLimitReached).toBe(true);
    expect(body.remaining).toBe(0);
    expect(body.isTokenLimitReached).toBe(true);
    expect(body.dailyTokenRemaining).toBe(0);
  });

  it('should_return_500_when_repository_fails', async () => {
    vi.mocked(chatRepository.getDailyUserMessageCount).mockRejectedValue(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Erro ao verificar uso');
  });
});