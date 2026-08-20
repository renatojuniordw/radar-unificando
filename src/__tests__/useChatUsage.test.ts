// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', fetchMock);

import { useChatUsage } from '@/hooks/useChatUsage';

describe('useChatUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_initialize_with_default_daily_usage', () => {
    const { result } = renderHook(() => useChatUsage());

    expect(result.current.dailyUsage.count).toBe(0);
    expect(result.current.dailyUsage.limit).toBe(50);
    expect(result.current.dailyUsage.remaining).toBe(50);
    expect(result.current.dailyUsage.isDailyLimitReached).toBe(false);
    expect(result.current.dailyUsage.dailyTokens).toBe(0);
    expect(result.current.dailyUsage.isTokenLimitReached).toBe(false);
    expect(result.current.dailyUsage.contextTokens).toBe(0);
    expect(result.current.dailyUsage.globalBudget).toEqual({
      usedUsd: 0,
      limitUsd: 0.95,
      ratio: 0,
      degraded: false,
      exhausted: false,
    });
  });

  it('should_update_daily_usage_when_fetchDailyUsage_succeeds', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        count: 5,
        limit: 50,
        remaining: 45,
        isDailyLimitReached: false,
        dailyTokens: 12000,
        dailyTokenLimit: 100000,
        dailyTokenRemaining: 88000,
        monthlyTokens: 50000,
        monthlyTokenLimit: 2000000,
        monthlyTokenRemaining: 1950000,
        isTokenLimitReached: false,
      }),
    });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchDailyUsage();
    });

    expect(result.current.dailyUsage.count).toBe(5);
    expect(result.current.dailyUsage.remaining).toBe(45);
    expect(result.current.dailyUsage.dailyTokens).toBe(12000);
  });

  it('should_keep_state_when_fetchDailyUsage_returns_not_ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchDailyUsage();
    });

    expect(result.current.dailyUsage.count).toBe(0);
  });

  it('should_keep_state_when_fetchDailyUsage_throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchDailyUsage();
    });

    expect(result.current.dailyUsage.count).toBe(0);
  });

  it('should_merge_only_contextTokens_when_fetchContextTokens_succeeds', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contextTokens: 1500 }),
    });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchContextTokens();
    });

    expect(result.current.dailyUsage.contextTokens).toBe(1500);
    // All other fields should remain at defaults
    expect(result.current.dailyUsage.count).toBe(0);
    expect(result.current.dailyUsage.limit).toBe(50);
  });

  it('should_default_contextTokens_to_zero_when_response_has_no_field', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchContextTokens();
    });

    expect(result.current.dailyUsage.contextTokens).toBe(0);
  });

  it('should_keep_state_when_fetchContextTokens_returns_not_ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchContextTokens();
    });

    expect(result.current.dailyUsage.contextTokens).toBe(0);
  });

  it('should_keep_state_when_fetchContextTokens_throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchContextTokens();
    });

    expect(result.current.dailyUsage.contextTokens).toBe(0);
  });

  it('should_call_correct_endpoints', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchDailyUsage();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/chat/usage');

    await act(async () => {
      await result.current.fetchContextTokens();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/chat/context');
  });

  it('should_not_leak_state_between_fetchDailyUsage_calls', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 10,
          limit: 50,
          remaining: 40,
          isDailyLimitReached: false,
          dailyTokens: 50000,
          dailyTokenLimit: 100000,
          dailyTokenRemaining: 50000,
          monthlyTokens: 100000,
          monthlyTokenLimit: 2000000,
          monthlyTokenRemaining: 1900000,
          isTokenLimitReached: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          limit: 50,
          remaining: 50,
          isDailyLimitReached: false,
          dailyTokens: 0,
          dailyTokenLimit: 100000,
          dailyTokenRemaining: 100000,
          monthlyTokens: 0,
          monthlyTokenLimit: 2000000,
          monthlyTokenRemaining: 2000000,
          isTokenLimitReached: false,
        }),
      });

    const { result } = renderHook(() => useChatUsage());

    await act(async () => {
      await result.current.fetchDailyUsage();
    });
    expect(result.current.dailyUsage.count).toBe(10);

    await act(async () => {
      await result.current.fetchDailyUsage();
    });
    // Second call replaces entire state (not merge)
    expect(result.current.dailyUsage.count).toBe(0);
  });
});
