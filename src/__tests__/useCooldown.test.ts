// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const storageMock = vi.hoisted(() => ({
  getCooldownEnd: vi.fn(),
  setCooldownEnd: vi.fn(),
  clearCooldown: vi.fn(),
}));
vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: storageMock,
}));

import { useCooldown } from '@/hooks/useCooldown';

// Settle as promises do effect de montagem (getCooldownEnd → .then/.finally).
async function flushMount() {
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe('useCooldown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMock.getCooldownEnd.mockResolvedValue(null);
    storageMock.setCooldownEnd.mockResolvedValue(undefined);
    storageMock.clearCooldown.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_load_pending_cooldown_rounded_up_on_mount', async () => {
    storageMock.getCooldownEnd.mockResolvedValue(Date.now() + 1500);
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    expect(result.current.cooldown).toBe(2);
    expect(result.current.loaded).toBe(true);
  });

  it('should_clear_storage_when_cooldown_already_expired', async () => {
    storageMock.getCooldownEnd.mockResolvedValue(Date.now() - 5000);
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    expect(result.current.cooldown).toBe(0);
    expect(storageMock.clearCooldown).toHaveBeenCalledTimes(1);
  });

  it('should_not_touch_storage_when_no_cooldown_saved', async () => {
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    expect(result.current.cooldown).toBe(0);
    expect(result.current.loaded).toBe(true);
    expect(storageMock.clearCooldown).not.toHaveBeenCalled();
  });

  it('should_still_mark_loaded_when_storage_lookup_fails', async () => {
    storageMock.getCooldownEnd.mockRejectedValue(new Error('db down'));
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    expect(result.current.loaded).toBe(true);
    expect(result.current.cooldown).toBe(0);
  });

  it('should_count_down_each_second_and_clear_storage_at_zero', async () => {
    vi.useFakeTimers();
    storageMock.getCooldownEnd.mockResolvedValue(Date.now() + 3000);
    const { result } = renderHook(() => useCooldown());
    await flushMount();
    expect(result.current.cooldown).toBe(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.cooldown).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.cooldown).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.cooldown).toBe(0);
    expect(storageMock.clearCooldown).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should_cleanup_interval_after_reaching_zero', async () => {
    vi.useFakeTimers();
    storageMock.getCooldownEnd.mockResolvedValue(Date.now() + 1000);
    const { result } = renderHook(() => useCooldown());
    await flushMount();
    expect(result.current.cooldown).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.cooldown).toBe(0);
    expect(storageMock.clearCooldown).toHaveBeenCalledTimes(1);

    // Avanço extra não deve disparar decrementos nem novas limpezas.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(storageMock.clearCooldown).toHaveBeenCalledTimes(1);
    expect(result.current.cooldown).toBe(0);
  });

  it('should_start_cooldown_persisting_end_timestamp', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    await act(async () => {
      await result.current.startCooldown(120);
    });

    expect(storageMock.setCooldownEnd).toHaveBeenCalledWith(Date.now() + 120000);
    expect(result.current.cooldown).toBe(120);
  });

  it('should_handle_start_cooldown_with_zero_seconds', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    await act(async () => {
      await result.current.startCooldown(0);
    });

    expect(result.current.cooldown).toBe(0);
    expect(storageMock.setCooldownEnd).toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(storageMock.clearCooldown).not.toHaveBeenCalled();
  });

  it('should_count_down_after_manual_set_cooldown', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown());
    await flushMount();

    act(() => result.current.setCooldown(2));
    expect(result.current.cooldown).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.cooldown).toBe(0);
    expect(storageMock.clearCooldown).toHaveBeenCalledTimes(1);
  });
});