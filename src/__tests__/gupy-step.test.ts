import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';

vi.mock('@/lib/core/mcp/gupy-client', () => ({
  gupyMcpClient: {
    searchJobs: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';

const mockJob = (overrides = {}) => ({
  empresa: 'TestCorp',
  plataforma: 'Gupy',
  na_lista: 'Não',
  cargo_categoria: 'Analista de Dados / Data Analyst',
  titulo_vaga: 'Data Analyst',
  tipo: 'Remoto',
  local: 'Remote',
  link: 'https://gupy.io/job/1',
  nome_na_plataforma: 'TestCorp',
  publicado: '2024-01-01',
  alerta: '',
  ...overrides,
});

describe('GupyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_jobs_from_mcp_when_logged_in', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue([mockJob()]);
    const result = await runGupyStep('run-1', { companies: ['TestCorp'], isLoggedIn: true });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].plataforma).toBe('Gupy');
  });

  it('should_fallback_to_rest_when_mcp_fails', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockRejectedValue(new Error('MCP error'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          careerPageName: 'FallbackCo',
          name: 'Data Analyst',
          isRemoteWork: true,
          workplaceType: 'Remoto',
          publishedDate: '2024-01-01',
          jobUrl: 'https://fallback.co/job/1',
        }],
      }),
    }) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: true });
    expect(result.length).toBeGreaterThan(0);
  });

  it('should_return_empty_array_when_not_logged_in_and_rest_fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    expect(result).toEqual([]);
  });

  it('should_label_jobs_as_na_lista_sim_when_company_in_list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          careerPageName: 'MyCompany',
          name: 'Data Analyst',
          isRemoteWork: true,
          workplaceType: 'Remoto',
          publishedDate: '2024-01-01',
          jobUrl: 'https://co/job/1',
        }],
      }),
    }) as any;
    const result = await runGupyStep('run-1', { companies: ['MyCompany'], isLoggedIn: false });
    expect(result[0].na_lista).toBe('Sim');
  });

  it('should_filter_out_non_remote_jobs_in_rest_mode', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { careerPageName: 'Co', name: 'Remote Job', isRemoteWork: true, workplaceType: 'Remoto', publishedDate: '', jobUrl: '' },
          { careerPageName: 'Co', name: 'Onsite Job', isRemoteWork: false, workplaceType: 'Presencial', publishedDate: '', jobUrl: '' },
        ],
      }),
    }) as any;
    const result = await runGupyStep('run-1', { companies: [], isLoggedIn: false });
    const nonRemote = result.filter(j => j.tipo === 'Presencial');
    expect(nonRemote).toHaveLength(0);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should_not_label_jobs_as_sim_when_not_in_company_list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          careerPageName: 'UnknownCorp',
          name: 'Data Analyst',
          isRemoteWork: true,
          workplaceType: 'Remoto',
          publishedDate: '',
          jobUrl: '',
        }],
      }),
    }) as any;
    const result = await runGupyStep('run-1', { companies: ['ListedCorp'], isLoggedIn: false });
    expect(result[0].na_lista).toBe('Não');
  });
});
