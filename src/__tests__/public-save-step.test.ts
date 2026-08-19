import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  publicJobRepository: { upsertMany: vi.fn() },
}));

import { publicJobRepository } from '@/lib/infrastructure/repositories';
import { runPublicSaveStep } from '@/lib/core/pipeline/steps/public-save-step';

const JOBS = [{ id: 'j1' }, { id: 'j2' }] as any;

describe('runPublicSaveStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_skip_when_no_jobs', async () => {
    expect(await runPublicSaveStep([])).toBe(0);
    expect(publicJobRepository.upsertMany).not.toHaveBeenCalled();
  });

  it('should_upsert_jobs_and_return_count', async () => {
    vi.mocked(publicJobRepository.upsertMany).mockResolvedValue(2);
    expect(await runPublicSaveStep(JOBS)).toBe(2);
    expect(publicJobRepository.upsertMany).toHaveBeenCalledWith(JOBS);
  });

  it('should_fail_open_when_upsert_throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(publicJobRepository.upsertMany).mockRejectedValue(new Error('db down'));
    expect(await runPublicSaveStep(JOBS)).toBe(0);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});