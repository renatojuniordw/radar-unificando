import { describe, it, expect, vi, afterEach } from 'vitest';

const { connectMock, onMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  onMock: vi.fn(),
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    status = 'ready';
    connect = connectMock;
    on = onMock;
  },
}));
vi.mock('@/lib/utils/debug', () => ({
  debugLog: vi.fn(),
}));

describe('redis client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    connectMock.mockReset();
    onMock.mockReset();
  });

  async function freshModule(connectImpl: () => Promise<void>) {
    connectMock.mockImplementation(connectImpl);
    vi.resetModules();
    return import('@/lib/infrastructure/redis/client');
  }

  it('should_report_ready_after_successful_connect', async () => {
    const { isRedisReady } = await freshModule(async () => {});
    await Promise.resolve();
    expect(isRedisReady()).toBe(true);
  });

  it('should_report_not_ready_after_failed_connect', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { isRedisReady } = await freshModule(async () => {
      throw new Error('ECONNREFUSED');
    });
    await Promise.resolve();
    expect(isRedisReady()).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Indisponível'), 'ECONNREFUSED');
    warn.mockRestore();
  });

  it('should_report_not_ready_when_status_not_ready', async () => {
    const { isRedisReady, redisClient } = await freshModule(async () => {});
    await Promise.resolve();
    (redisClient as any).status = 'reconnecting';
    expect(isRedisReady()).toBe(false);
  });

  it('should_mark_not_ready_on_client_error_event', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { isRedisReady } = await freshModule(async () => {});
    await Promise.resolve();
    expect(isRedisReady()).toBe(true);

    const errorHandler = onMock.mock.calls.find((c) => c[0] === 'error')?.[1];
    errorHandler({ message: 'connection lost' });
    expect(isRedisReady()).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Erro no client'), 'connection lost');
    warn.mockRestore();
  });
});