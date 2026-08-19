import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { revalidateJobsMock } = vi.hoisted(() => ({ revalidateJobsMock: vi.fn() }));
vi.mock('@/lib/core/pipeline/revalidate-jobs', () => ({ revalidateJobs: revalidateJobsMock }));

describe('instrumentation.register', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    revalidateJobsMock.mockReset();
    revalidateJobsMock.mockResolvedValue({ checked: 0, deactivated: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  async function loadRegister(): Promise<() => Promise<void>> {
    const mod = await import('@/instrumentation');
    return mod.register;
  }

  it('should_skip_scheduling_outside_nodejs_runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const register = await loadRegister();
    await register();
    expect(revalidateJobsMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should_schedule_and_run_revalidation_on_initial_delay', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    const register = await loadRegister();
    await register();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(revalidateJobsMock).toHaveBeenCalled();
  });

  it('should_log_when_jobs_checked', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    revalidateJobsMock.mockResolvedValue({ checked: 3, deactivated: 1 });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const register = await loadRegister();
    await register();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('3 vaga(s) checada(s)'));
    log.mockRestore();
  });

  it('should_warn_when_db_unavailable_p1001', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    revalidateJobsMock.mockRejectedValue({ code: 'P1001' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const register = await loadRegister();
    await register();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('P1001'));
    warn.mockRestore();
  });

  it('should_log_error_for_other_failures', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    revalidateJobsMock.mockRejectedValue(new Error('boom'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const register = await loadRegister();
    await register();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Falha ao revalidar vagas'), expect.any(Error));
    error.mockRestore();
  });
});