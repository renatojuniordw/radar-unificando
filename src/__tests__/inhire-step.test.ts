import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';

vi.mock('@/lib/core/scrapers/inhire-scraper', () => ({
  inhireScraper: {
    searchJobs: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

import { inhireScraper } from '@/lib/core/scrapers/inhire-scraper';

describe('InHireStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_labeled_jobs_on_success', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([
      { company: 'CorpA', platform: 'InHire', onList: 'Não', roleCategory: 'Analyst', title: 'Data Analyst', type: 'Remoto', location: 'Remote', link: 'https://a.com', companyNameOnPlatform: 'CorpA', postedAt: '', alert: '' } as any,
    ]);
    const result = await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] });
    expect(result).toHaveLength(1);
    expect(result[0].onList).toBe('Sim');
  });

  it('should_label_jobs_as_nao_when_company_not_in_list', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([
      { company: 'UnknownCorp', platform: 'InHire', onList: 'Não', roleCategory: 'Analyst', title: 'Data Analyst', type: 'Remoto', location: 'Remote', link: 'https://a.com', companyNameOnPlatform: 'UnknownCorp', postedAt: '', alert: '' } as any,
    ]);
    const result = await runInHireStep('run-1', { companies: ['ListedCorp'] });
    expect(result[0].onList).toBe('Não');
  });

  it('should_return_empty_array_on_scraper_error', async () => {
    vi.mocked(inhireScraper.searchJobs).mockRejectedValue(new Error('API error'));
    const result = await runInHireStep('run-1', { companies: ['CorpA'] });
    expect(result).toEqual([]);
  });

  it('should_pass_companies_to_scraper', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([]);
    await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] });
    expect(inhireScraper.searchJobs).toHaveBeenCalledWith(['CorpA', 'CorpB']);
  });
});
