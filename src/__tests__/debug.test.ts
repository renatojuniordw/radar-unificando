import { describe, it, expect, vi, afterEach } from 'vitest';
import { debugLog } from '@/lib/utils/debug';

describe('debugLog', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should call console.log when NODE_ENV is not production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog('test message', 42);
    expect(consoleSpy).toHaveBeenCalledWith('test message', 42);
  });

  it('should call console.log when NODE_ENV is test', () => {
    vi.stubEnv('NODE_ENV', 'test');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog('debug info');
    expect(consoleSpy).toHaveBeenCalledWith('debug info');
  });

  it('should NOT call console.log when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog('should not appear');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle no arguments gracefully', () => {
    vi.stubEnv('NODE_ENV', 'development');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog();
    expect(consoleSpy).toHaveBeenCalledWith();
  });

  it('should pass multiple arguments to console.log', () => {
    vi.stubEnv('NODE_ENV', 'development');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog('a', 'b', 'c', 1, true, null);
    expect(consoleSpy).toHaveBeenCalledWith('a', 'b', 'c', 1, true, null);
  });

  it('should log when NODE_ENV is undefined (not production)', () => {
    vi.stubEnv('NODE_ENV', undefined as unknown as string);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debugLog('should appear');
    expect(consoleSpy).toHaveBeenCalledWith('should appear');
  });
});
