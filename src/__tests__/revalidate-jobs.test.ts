import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: {
    findStaleForRevalidation: vi.fn(),
    markStatus: vi.fn(),
    touchLastChecked: vi.fn(),
  },
}));
vi.mock('@/lib/core/pipeline/link-check', () => ({
  isLinkDead: vi.fn(),
  mapWithConcurrency: vi.fn(),
}));

import { jobRepository } from '@/lib/infrastructure/repositories';
import { isLinkDead, mapWithConcurrency } from '@/lib/core/pipeline/link-check';
import { revalidateJobs } from '@/lib/core/pipeline/revalidate-jobs';

const STALE = [
  { id: 'job-1', link: 'https://x.io/1' },
  { id: 'job-2', link: 'https://x.io/2' },
  { id: 'job-3', link: 'https://x.io/3' },
];

describe('revalidateJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobRepository.findStaleForRevalidation).mockResolvedValue(STALE as any);
    vi.mocked(jobRepository.markStatus).mockResolvedValue({ count: 1 } as any);
    vi.mocked(jobRepository.touchLastChecked).mockResolvedValue({ count: 2 } as any);
    vi.mocked(mapWithConcurrency).mockImplementation(async (items: unknown[], _c: number, fn: (item: unknown) => Promise<unknown>) =>
      Promise.all(items.map((item) => fn(item) as Promise<boolean>)),
    );
  });

  it('should_short_circuit_when_no_stale_jobs', async () => {
    vi.mocked(jobRepository.findStaleForRevalidation).mockResolvedValue([]);
    const result = await revalidateJobs();
    expect(result).toEqual({ checked: 0, deactivated: 0 });
    expect(jobRepository.markStatus).not.toHaveBeenCalled();
    expect(jobRepository.touchLastChecked).not.toHaveBeenCalled();
  });

  it('should_mark_dead_jobs_inactive_and_touch_alive_ones', async () => {
    vi.mocked(isLinkDead)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const result = await revalidateJobs();
    expect(result).toEqual({ checked: 3, deactivated: 1 });
    expect(jobRepository.markStatus).toHaveBeenCalledWith(['job-1'], 'inactive');
    expect(jobRepository.touchLastChecked).toHaveBeenCalledWith(['job-2', 'job-3']);
  });

  it('should_mark_all_dead_when_all_links_dead', async () => {
    vi.mocked(isLinkDead).mockResolvedValue(true);
    const result = await revalidateJobs();
    expect(result.deactivated).toBe(3);
    expect(jobRepository.markStatus).toHaveBeenCalledWith(['job-1', 'job-2', 'job-3'], 'inactive');
    expect(jobRepository.touchLastChecked).toHaveBeenCalledWith([]);
  });
});