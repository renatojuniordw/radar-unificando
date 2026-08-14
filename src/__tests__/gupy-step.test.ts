import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

import type { Job } from '@/types';

const mockJob = (overrides: Partial<Job> = {}): Job => ({
  company: 'TestCorp',
  platform: 'Gupy',
  onList: 'Não',
  roleCategory: 'Analista de Dados / Data Analyst',
  title: 'Data Analyst',
  type: 'Remoto',
  location: 'Remote',
  link: 'https://gupy.io/job/1',
  companyNameOnPlatform: 'TestCorp',
  postedAt: new Date().toISOString(),
  alert: '',
  ...overrides,
});

// Mock de página REST: retorna os dados uma vez e depois vazio, encerrando a paginação.
const restPage = (data: unknown[]) =>
  vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data }) })
    .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

describe('GupyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_jobs_from_mcp_when_logged_in', async () => {
    const mcpClient = { searchJobs: vi.fn().mockResolvedValue([mockJob()]) };
    const result = await runGupyStep(
      'run-1',
      { companies: ['TestCorp'], isLoggedIn: true, queries: ['data analyst'] },
      { mcpClient },
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].platform).toBe('Gupy');
  });

  it('should_call_mcp_with_limit_within_gupy_max_of_100', async () => {
    const mcpClient = { searchJobs: vi.fn().mockResolvedValue([mockJob()]) };
    await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['data analyst', 'analista'] },
      { mcpClient },
    );
    expect(mcpClient.searchJobs).toHaveBeenCalledTimes(2);
    for (const call of mcpClient.searchJobs.mock.calls) {
      expect(call[1]).toBeLessThanOrEqual(100);
    }
  });

  it('should_discard_physical_design_jobs_from_design_search', async () => {
    const mcpClient = {
      searchJobs: vi.fn().mockResolvedValue([
        mockJob({ title: 'Product Designer Sênior' }),
        mockJob({ title: 'Designer de Produto & Superfície (Estamparia)' }),
      ]),
    };
    const result = await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['designer de produto'] },
      { mcpClient },
    );
    expect(result.map(j => j.title)).toEqual(['Product Designer Sênior']);
  });

  it('should_paginate_mcp_up_to_500_when_there_are_more_results', async () => {
    const mcpClient = {
      searchJobs: vi.fn()
        .mockResolvedValueOnce(Array.from({ length: 100 }, () => mockJob()))
        .mockResolvedValueOnce(Array.from({ length: 100 }, () => mockJob()))
        .mockResolvedValue([]),
    };
    const result = await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['data analyst'] },
      { mcpClient },
    );
    expect(mcpClient.searchJobs).toHaveBeenCalledTimes(3);
    expect(mcpClient.searchJobs).toHaveBeenNthCalledWith(1, 'data analyst', 100, 0);
    expect(mcpClient.searchJobs).toHaveBeenNthCalledWith(2, 'data analyst', 100, 100);
    expect(mcpClient.searchJobs).toHaveBeenNthCalledWith(3, 'data analyst', 100, 200);
    expect(result.length).toBe(200);
  });

  it('should_stop_paginating_mcp_when_page_returns_fewer_than_100', async () => {
    const mcpClient = {
      searchJobs: vi.fn().mockResolvedValueOnce(Array.from({ length: 50 }, () => mockJob())),
    };
    const result = await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['data analyst'] },
      { mcpClient },
    );
    expect(mcpClient.searchJobs).toHaveBeenCalledTimes(1);
    expect(result.length).toBe(50);
  });

  it('should_discard_jobs_posted_more_than_20_days_ago', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const mcpClient = {
      searchJobs: vi.fn().mockResolvedValue([
        mockJob({ title: 'Vaga Antiga', postedAt: thirtyDaysAgo }),
        mockJob({ title: 'Vaga Recente', postedAt: new Date().toISOString() }),
      ]),
    };
    const result = await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['data analyst'] },
      { mcpClient },
    );
    expect(result.map(j => j.title)).toEqual(['Vaga Recente']);
  });

  it('should_fallback_to_rest_when_mcp_fails', async () => {
    const mcpClient = { searchJobs: vi.fn().mockRejectedValue(new Error('MCP error')) };
    global.fetch = restPage([{
      careerPageName: 'FallbackCo',
      name: 'Data Analyst',
      workplaceType: 'Remoto',
      publishedDate: new Date().toISOString(),
      jobUrl: 'https://fallback.co/job/1',
    }]) as any;
    const result = await runGupyStep(
      'run-1',
      { companies: [], isLoggedIn: true, queries: ['data'] },
      { mcpClient },
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it('should_return_empty_array_when_not_logged_in_and_rest_fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result).toEqual([]);
  });

  it('should_label_jobs_as_on_list_sim_when_company_in_list', async () => {
    global.fetch = restPage([{
      careerPageName: 'MyCompany',
      name: 'Data Analyst',
      workplaceType: 'Remoto',
      publishedDate: new Date().toISOString(),
      jobUrl: 'https://co/job/1',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: ['MyCompany'], isLoggedIn: false });
    expect(result[0].onList).toBe('Sim');
  });

  it('should_not_label_jobs_as_sim_when_not_in_company_list', async () => {
    global.fetch = restPage([{
      careerPageName: 'UnknownCorp',
      name: 'Data Analyst',
      workplaceType: 'Remoto',
      publishedDate: '',
      jobUrl: '',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].onList).toBe('Não');
  });

  it('should_strip_html_tags_and_decode_entities_from_job_description', async () => {
    global.fetch = restPage([{
      careerPageName: 'Co',
      name: 'Data Analyst',
      description:
        '<p>Vaga <strong>pleno</strong> com &amp; benefícios&nbsp;extras &apos;bônus&apos; &lt;3.</p><script>var x = 1;</script>',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].description).toBe("Vaga pleno com & benefícios extras 'bônus' <3.");
  });

  it('should_preserve_unknown_entities_in_job_description', async () => {
    global.fetch = restPage([{
      careerPageName: 'Co',
      name: 'Data Analyst',
      description: '<p>Termo &foo; preservado</p>',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].description).toBe('Termo &foo; preservado');
  });

  it('should_truncate_job_description_to_3000_chars', async () => {
    global.fetch = restPage([{
      careerPageName: 'Co',
      name: 'Data Analyst',
      description: `<p>${'x'.repeat(4000)}</p>`,
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].description).toBe('x'.repeat(3000));
    expect(result[0].description!.length).toBe(3000);
  });

  it('should_leave_description_undefined_when_job_has_none', async () => {
    global.fetch = restPage([{
      careerPageName: 'Co',
      name: 'Data Analyst',
      jobUrl: 'https://co/job/1',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].description).toBeUndefined();
  });

  it('should_combine_queries_and_companies_into_cartesian_searches', async () => {
    global.fetch = restPage([{
      careerPageName: 'Co',
      name: 'Data Analyst',
      jobUrl: 'https://co/job/1',
    }]) as any;
    const result = await runGupyStep('run-1', {
      companies: ['Co'],
      isLoggedIn: false,
      queries: ['analista', 'dev'],
    });
    expect(result.length).toBe(1);
  });

  it('should_continue_to_next_search_when_fetch_throws', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ careerPageName: 'Co', name: 'Analista', jobUrl: 'https://co/1' }] }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    global.fetch = fetchMock as any;
    const result = await runGupyStep('run-1', {
      companies: [],
      isLoggedIn: false,
      queries: ['analista', 'dev'],
    });
    expect(result.length).toBe(1);
  });

  it('should_map_job_from_company_name_with_missing_optional_fields', async () => {
    global.fetch = restPage([{
      companyName: 'OtherCorp',
      workplaceType: 'Híbrido',
      city: 'SP',
      state: 'SP',
      country: 'BR',
      jobUrl: 'https://co/job/2',
    }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].company).toBe('OtherCorp');
    expect(result[0].title).toBe('');
    expect(result[0].onList).toBe('Não');
    expect(result[0].description).toBeUndefined();
  });

  it('should_filter_out_jobs_not_in_target_company_list', async () => {
    global.fetch = restPage([{ companyName: 'OtherCorp', name: 'Analista' }]) as any;
    const result = await runGupyStep('run-1', { companies: ['TargetCo'], isLoggedIn: false });
    expect(result).toEqual([]);
  });

  it('should_default_company_to_empty_string_when_job_has_no_company', async () => {
    global.fetch = restPage([{ name: 'Analista' }]) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result[0].company).toBe('');
    expect(result[0].link).toBe('');
  });

  it('should_handle_rest_response_without_data_field', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result).toEqual([]);
  });
});