// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    skills: [],
    currentRole: null,
    area: null,
  })),
}));
vi.mock('@/lib/utils/analytics', () => ({
  trackJobSearch: vi.fn(),
}));

const storageMock = vi.hoisted(() => ({
  getJobs: vi.fn().mockResolvedValue([]),
  setJobs: vi.fn().mockResolvedValue(undefined),
  getFilters: vi.fn().mockResolvedValue(null),
  setFilters: vi.fn().mockResolvedValue(undefined),
  getLastRunAt: vi.fn().mockResolvedValue(null),
  setLastRunAt: vi.fn().mockResolvedValue(undefined),
  getCooldownEnd: vi.fn().mockResolvedValue(null),
  setCooldownEnd: vi.fn().mockResolvedValue(undefined),
  clearCooldown: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: storageMock,
}));

import { useJobSearch } from '@/hooks/useJobSearch';

// jsdom não implementa EventSource — stub mínimo (o stream não chega a disparar).
class FakeEventSource {
  onopen: unknown = null;
  onmessage: unknown = null;
  onerror: unknown = null;
  addEventListener() {}
  removeEventListener() {}
  close() {}
}
(globalThis as any).EventSource = FakeEventSource;

const fetchMock = vi.fn();
(globalThis as any).fetch = fetchMock;

function mockFetchResponse(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('useJobSearch — cooldown do pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    storageMock.getFilters.mockResolvedValue(null);
    storageMock.getLastRunAt.mockResolvedValue(null);
    storageMock.getCooldownEnd.mockResolvedValue(null);
  });

  it('auto_sync_429_nao_aplica_cooldown_nem_snackbar_e_marca_lastRunAt', async () => {
    mockFetchResponse(429, { error: 'Muitas requisições', retryAfter: 300 });
    const { result } = renderHook(() => useJobSearch());

    await act(async () => {
      await result.current.handleStart({ silent: true });
    });

    expect(result.current.cooldown).toBe(0);
    expect(result.current.snackbar).toBeNull();
    expect(storageMock.setCooldownEnd).not.toHaveBeenCalled();
    // Marca a tentativa para o effect de auto-sync não re-disparar em loop.
    expect(storageMock.setLastRunAt).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('busca_manual_429_aplica_cooldown_e_snackbar', async () => {
    mockFetchResponse(429, { error: 'Muitas requisições', retryAfter: 300 });
    const { result } = renderHook(() => useJobSearch());

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.cooldown).toBe(300);
    expect(result.current.snackbar?.severity).toBe('info');
    expect(storageMock.setCooldownEnd).toHaveBeenCalledWith(expect.any(Number));
  });

  it('busca_manual_sucesso_aplica_cooldown_do_servidor', async () => {
    mockFetchResponse(200, { runId: 'run-1', cooldownSeconds: 300 });
    const { result } = renderHook(() => useJobSearch());

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.cooldown).toBe(300);
    expect(storageMock.setCooldownEnd).toHaveBeenCalledWith(expect.any(Number));
  });

  it('auto_sync_sucesso_nao_aplica_cooldown', async () => {
    mockFetchResponse(200, { runId: 'run-auto', cooldownSeconds: 0 });
    const { result } = renderHook(() => useJobSearch());

    await act(async () => {
      await result.current.handleStart({ silent: true });
    });

    expect(result.current.cooldown).toBe(0);
    expect(storageMock.setCooldownEnd).not.toHaveBeenCalled();
  });
});
