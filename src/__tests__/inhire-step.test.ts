import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import type { Job } from '@/types';

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

const inhireScraperMock = vi.hoisted(() => ({ searchJobs: vi.fn() }));
vi.mock('@/lib/core/scrapers/inhire-scraper', () => ({
  inhireScraper: inhireScraperMock,
}));

const { progressEmitter } = await import('@/lib/core/pipeline/progress-emitter');

const makeJob = (company: string, overrides: Partial<Job> = {}): Job => ({
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
  ...overrides,
});

describe('InHireStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inhireScraperMock.searchJobs.mockReset();
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

  it('should_pass_undefined_to_scraper_when_companies_empty', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CorpA')]) };
    await runInHireStep('run-1', { companies: [] }, { scraper });
    expect(scraper.searchJobs).toHaveBeenCalledWith(undefined);
  });

  it('should_filter_jobs_by_query_terms_case_insensitive', async () => {
    const scraper = {
      searchJobs: vi.fn().mockResolvedValue([
        makeJob('CorpA'),
        makeJob('CorpB', { title: 'Data Engineer' }),
      ]),
    };
    const result = await runInHireStep(
      'run-1',
      { companies: ['CorpA'], queries: ['data analyst'] },
      { scraper },
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Data Analyst');
  });

  it('should_trim_query_terms_before_filtering', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CorpA')]) };
    const result = await runInHireStep(
      'run-1',
      { companies: ['CorpA'], queries: ['  data analyst  '] },
      { scraper },
    );
    expect(result).toHaveLength(1);
  });

  it('should_not_filter_when_queries_absent_or_empty', async () => {
    const jobs = [makeJob('CorpA'), makeJob('CorpB', { title: 'Data Engineer' })];
    const scraper = { searchJobs: vi.fn().mockResolvedValue(jobs) };

    const noQueries = await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });
    const emptyQueries = await runInHireStep(
      'run-2',
      { companies: ['CorpA'], queries: [] },
      { scraper },
    );

    expect(noQueries).toHaveLength(2);
    expect(emptyQueries).toHaveLength(2);
  });

  it('should_label_company_matching_case_insensitively', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CORPA', { company: 'corpa' })]) };
    const result = await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });
    expect(result[0].onList).toBe('Sim');
  });

  it('should_label_company_after_normalizing_list_entries', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CorpA')]) };
    const result = await runInHireStep(
      'run-1',
      { companies: ['  CorpA  ', 'CorpB'] },
      { scraper },
    );
    expect(result[0].onList).toBe('Sim');
  });

  it('should_emit_step_start_and_step_complete_events', async () => {
    const scraper = { searchJobs: vi.fn().mockResolvedValue([makeJob('CorpA')]) };
    await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });

    expect(progressEmitter.emit).toHaveBeenCalledWith('run-1', {
      type: 'step_start',
      step: 'InHire',
      message: 'Buscando vagas na InHire...',
    });
    expect(progressEmitter.emit).toHaveBeenCalledWith('run-1', {
      type: 'step_complete',
      step: 'InHire',
      message: 'InHire: 1 vagas encontradas',
    });
  });

  it('should_emit_step_warn_with_error_message_on_failure', async () => {
    const scraper = { searchJobs: vi.fn().mockRejectedValue(new Error('API error')) };
    await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });

    expect(progressEmitter.emit).toHaveBeenCalledWith('run-1', {
      type: 'step_warn',
      step: 'InHire',
      message: 'InHire: API error',
    });
  });

  it('should_use_fallback_warn_message_when_thrown_value_is_not_an_error', async () => {
    const scraper = { searchJobs: vi.fn().mockRejectedValue('string failure') };
    const result = await runInHireStep('run-1', { companies: ['CorpA'] }, { scraper });

    expect(result).toEqual([]);
    expect(progressEmitter.emit).toHaveBeenCalledWith('run-1', {
      type: 'step_warn',
      step: 'InHire',
      message: 'InHire: Falha ao buscar',
    });
  });

  it('should_filter_out_stale_jobs_by_freshness', async () => {
    const scraper = {
      searchJobs: vi.fn().mockResolvedValue([
        makeJob('CorpA', { postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }),
        makeJob('CorpB', { postedAt: '2020-01-01T00:00:00.000Z' }),
      ]),
    };
    const result = await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] }, { scraper });
    expect(result.map((j) => j.company)).toEqual(['CorpA']);
  });

  it('should_use_default_inhire_scraper_when_no_deps_provided', async () => {
    inhireScraperMock.searchJobs.mockResolvedValue([makeJob('CorpA')]);

    const result = await runInHireStep('run-1', { companies: ['CorpA'] });

    expect(inhireScraperMock.searchJobs).toHaveBeenCalledWith(['CorpA']);
    expect(result[0].onList).toBe('Sim');
  });
});