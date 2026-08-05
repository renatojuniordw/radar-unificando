import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';

vi.mock('@/lib/core/dedup', () => ({
  dedupEngine: {
    dedupByLink: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/link-check', async () => {
  const actual = await vi.importActual<typeof import('@/lib/core/pipeline/link-check')>('@/lib/core/pipeline/link-check');
  return {
    ...actual,
    isLinkDead: vi.fn().mockResolvedValue(false),
  };
});

import { dedupEngine } from '@/lib/core/dedup';

const makeJob = (link: string) => ({
  company: 'Corp',
  platform: 'Gupy' as const,
  onList: 'Não' as const,
  roleCategory: 'Analyst',
  title: 'Data Analyst',
  type: 'Remoto',
  location: 'Remote',
  link,
  companyNameOnPlatform: 'Corp',
  postedAt: '2024-01-01',
  alert: '',
});

const makeRepo = () => ({
  findExistingLinks: vi.fn().mockResolvedValue(new Set()),
  createMany: vi.fn().mockResolvedValue(0),
});

describe('SaveStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_dedup_and_save_jobs_returning_inserted_count', async () => {
    const jobRepository = makeRepo();
    jobRepository.createMany.mockResolvedValue(2);
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([makeJob('https://a.com/1'), makeJob('https://a.com/2')]);
    const result = await runSaveStep('run-1', [makeJob('https://a.com/1'), makeJob('https://a.com/2')], { userId: 'user-1', source: 'gupy_mcp' }, { jobRepository });
    expect(result).toBe(2);
  });

  it('should_limit_to_200_jobs_after_dedup', async () => {
    const jobRepository = makeRepo();
    jobRepository.createMany.mockResolvedValue(200);
    const manyJobs = Array.from({ length: 300 }, (_, i) => makeJob(`https://a.com/${i}`));
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue(manyJobs);
    const result = await runSaveStep('run-1', manyJobs, { userId: 'user-1', source: 'gupy_mcp' }, { jobRepository });
    expect(result).toBe(200);
  });

  it('should_map_job_data_to_prisma_schema', async () => {
    const jobRepository = makeRepo();
    const job = makeJob('https://a.com/1');
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([job]);
    jobRepository.createMany.mockImplementation(async (data: any[]) => {
      expect(data[0]).toHaveProperty('userId', 'user-1');
      expect(data[0]).toHaveProperty('company', 'Corp');
      expect(data[0]).toHaveProperty('platform', 'Gupy');
      expect(data[0]).toHaveProperty('onList', 'Não');
      expect(data[0]).toHaveProperty('roleCategory', 'Analyst');
      expect(data[0]).toHaveProperty('title', 'Data Analyst');
      expect(data[0]).toHaveProperty('link', 'https://a.com/1');
      return 1;
    });
    await runSaveStep('run-1', [job], { userId: 'user-1', source: 'gupy_mcp' }, { jobRepository });
  });

  it('should_return_zero_when_no_jobs_to_save', async () => {
    const jobRepository = makeRepo();
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([]);
    const result = await runSaveStep('run-1', [], { userId: 'user-1', source: 'gupy_mcp' }, { jobRepository });
    expect(result).toBe(0);
  });
});