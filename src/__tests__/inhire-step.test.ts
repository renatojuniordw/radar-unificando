import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import type { Job } from '@/types';

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

const makeJob = (company: string): Job => ({
  company,
  platform: 'InHire',
  onList: 'Não',
  roleCategory: 'Analyst',
  title: 'Data Analyst',
  type: 'Remoto',
  location: 'Remote',
  link: 'https://a.com',
  companyNameOnPlatform: company,
  postedAt: '',
  alert: '',
});

describe('InHireStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_labeled_jobs_on_success', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CorpA')]) };
    const result = await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] }, { scraper });
    expect(result).toHaveLength(1);
    expect(result[0].onList).toBe('Sim');
  });

  it('should_label_jobs_as_nao_when_company_not_in_list', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('UnknownCorp')]) };
    const result = await runInHireStep('run-1', { companies: ['ListedCorp'] }, { scraper });
    expect(result[0].onList).toBe('Não');
  });

  it('should_return_empty_array_on_scraper_error', async () => {
    const scraper = { searchJobs: vi.fn().mockRejectedValue(new Error('API error')) };
    const result = await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });
    expect(result).toEqual([]);
  });

  it('should_pass_companies_to_scraper', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([]) };
    await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] }, { scraper });
    expect(scraper.searchJobs).toHaveBeenCalledWith(['CorpA', 'CorpB']);
  });
});