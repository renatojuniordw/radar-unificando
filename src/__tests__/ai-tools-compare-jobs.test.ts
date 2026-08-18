import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/tools/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/tools/shared')>()),
  analyzeWithCache: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeWithCache } from '@/lib/core/ai/tools/shared';
import { createCompareJobsTool } from '@/lib/core/ai/tools/compare-jobs';
import { PROFILE, JOB_ANALYSIS, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createCompareJobsTool', () => {
  const JOBS = [
    { jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' },
    { jobTitle: 'QA', jobDescription: 'Vaga de QA com dez caracteres' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(analyzeWithCache).mockResolvedValue(JOB_ANALYSIS as any);
  });

  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    expect(await tool.execute({ jobs: JOBS })).toEqual({
      error: expect.stringContaining('Perfil não encontrado'),
    });
  });

  it('should_rank_jobs_best_fit_first', async () => {
    vi.mocked(analyzeWithCache)
      .mockResolvedValueOnce({ ...JOB_ANALYSIS, overallFit: 'medium' } as any)
      .mockResolvedValueOnce({ ...JOB_ANALYSIS, overallFit: 'high' } as any);
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobs: JOBS });
    expect(result.ranking).toHaveLength(2);
    expect(result.ranking[0].jobTitle).toBe('QA');
    expect(result.ranking[0].overallFit).toBe('high');
    expect(result.ranking[1].overallFit).toBe('medium');
  });

  it('should_reject_less_than_two_jobs', () => {
    const schema = schemaOf(createCompareJobsTool('user-1'));
    expect(schema.safeParse({ jobs: [JOBS[0]] }).success).toBe(false);
  });

  it('should_reject_more_than_five_jobs', () => {
    const schema = schemaOf(createCompareJobsTool('user-1'));
    const five = [...JOBS, ...JOBS, ...JOBS, ...JOBS];
    expect(five).toHaveLength(8);
    expect(schema.safeParse({ jobs: five.slice(0, 6) }).success).toBe(false);
  });

  it('should_include_job_title_in_ranking_entries', async () => {
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobs: JOBS });
    expect(result.ranking.map((r: { jobTitle: string }) => r.jobTitle)).toEqual(['Dev', 'QA']);
  });
});