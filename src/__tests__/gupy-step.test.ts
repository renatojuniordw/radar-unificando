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
  postedAt: '2024-01-01',
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

  it('should_fallback_to_rest_when_mcp_fails', async () => {
    const mcpClient = { searchJobs: vi.fn().mockRejectedValue(new Error('MCP error')) };
    global.fetch = restPage([{
      careerPageName: 'FallbackCo',
      name: 'Data Analyst',
      workplaceType: 'Remoto',
      publishedDate: '2024-01-01',
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
      publishedDate: '2024-01-01',
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
});