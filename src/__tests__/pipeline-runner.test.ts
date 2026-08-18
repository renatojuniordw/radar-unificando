import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  pipelineRunRepository: { update: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: { emit: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/steps/gupy-step', () => ({
  runGupyStep: vi.fn().mockResolvedValue([]),
  shouldUseGupyMCP: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/core/pipeline/steps/inhire-step', () => ({ runInHireStep: vi.fn().mockResolvedValue([]) }));
const { runDiscoveryStep: mockDiscovery } = vi.hoisted(() => ({ runDiscoveryStep: vi.fn() }));
vi.mock('@/lib/core/pipeline/steps/discovery-step', () => ({ runDiscoveryStep: mockDiscovery }));
vi.mock('@/lib/core/pipeline/steps/save-step', () => ({ runSaveStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/pipeline/steps/public-save-step', () => ({ runPublicSaveStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/dedup', () => ({ dedupEngine: { mergeSources: vi.fn().mockReturnValue([]) } }));
const { expandQueries: mockExpandQueries } = vi.hoisted(() => ({ expandQueries: vi.fn() }));
vi.mock('@/lib/core/pipeline/query-expansion/service', () => ({ expandQueries: mockExpandQueries }));

import { runPipeline, ANONYMOUS_USER_ID } from '@/lib/core/pipeline/pipeline-runner';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import { dedupEngine } from '@/lib/core/dedup';
import { pipelineCache } from '@/lib/infrastructure/cache/pipeline-cache';
import type { Job } from '@/types';

describe('runPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pipelineCache.clear();
    mockDiscovery.mockResolvedValue(3);
    vi.mocked(runGupyStep).mockResolvedValue([]);
    mockExpandQueries.mockImplementation(async (queries: string[]) => [...queries]);
  });

  it('nao_roda_discovery_para_usuario_anonimo_mas_grava_run_completo', async () => {
    await runPipeline('run-1', ANONYMOUS_USER_ID, ['CorpA'], [], false);
    expect(mockDiscovery).not.toHaveBeenCalled();
    expect(pipelineRunRepository.update).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ status: 'completed' }),
    );
    expect(progressEmitter.emit).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ type: 'pipeline_complete', jobs: [] }),
    );
  });

  it('roda_discovery_para_usuario_logado_por_padrao_e_persiste_contagem', async () => {
    await runPipeline('run-1', 'user-1', ['CorpA'], [], true);
    expect(mockDiscovery).toHaveBeenCalledWith('run-1', { companies: ['CorpA'], userId: 'user-1' });
    expect(pipelineRunRepository.update).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ status: 'completed', newCompaniesFound: 3 }),
    );
  });

  it('nao_roda_discovery_quando_discoveryEnabled_false', async () => {
    await runPipeline('run-1', 'user-1', ['CorpA'], [], true, { discoveryEnabled: false });
    expect(mockDiscovery).not.toHaveBeenCalled();
    expect(pipelineRunRepository.update).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ newCompaniesFound: 0 }),
    );
  });

  it('grava_status_failed_quando_step_lanca_erro', async () => {
    vi.mocked(runGupyStep).mockRejectedValue(new Error('MCP fora do ar'));
    await runPipeline('run-1', 'user-1', ['CorpA'], [], true);
    expect(pipelineRunRepository.update).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ status: 'failed' }),
    );
    expect(progressEmitter.emit).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ type: 'pipeline_error' }),
    );
  });

  it('passa_consultas_expandidas_para_gupy_e_originais_para_inhire', async () => {
    mockExpandQueries.mockResolvedValue(['Analista de Dados', 'Data Analyst']);
    await runPipeline('run-1', 'user-1', ['CorpA'], ['Analista de Dados'], true);
    expect(runGupyStep).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        queries: ['Analista de Dados', 'Data Analyst'],
        relevanceQueries: ['Analista de Dados'],
      }),
    );
    expect(runInHireStep).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ queries: ['Analista de Dados'] }),
    );
  });

  it('emite_jobs_no_pipeline_complete_para_usuario_logado', async () => {
    const jobs: Job[] = [
      {
        company: 'iFood',
        platform: 'Gupy',
        onList: 'Não',
        roleCategory: '',
        title: 'Product Designer',
        type: 'hybrid',
        location: 'SP',
        link: 'https://gupy.io/job/1',
        companyNameOnPlatform: 'iFood',
        postedAt: new Date().toISOString(),
        alert: '',
      },
    ];
    vi.mocked(runGupyStep).mockResolvedValue(jobs);
    vi.mocked(dedupEngine.mergeSources).mockReturnValue(jobs);

    await runPipeline('run-1', 'user-1', ['CorpA'], ['Designer'], true);

    expect(progressEmitter.emit).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ type: 'pipeline_complete', jobs }),
    );
  });

  it('ordena_jobs_da_mais_recente_para_mais_antiga_no_pipeline_complete', async () => {
    const baseJob = {
      platform: 'Gupy' as const,
      onList: 'Não' as const,
      roleCategory: '',
      type: 'hybrid',
      location: 'SP',
      companyNameOnPlatform: 'CorpA',
      alert: '',
    };
    const oldJob: Job = { ...baseJob, company: 'Antiga', title: 'Antiga', link: 'https://gupy.io/job/old', postedAt: '2024-01-01T00:00:00.000Z' };
    const newJob: Job = { ...baseJob, company: 'Nova', title: 'Nova', link: 'https://gupy.io/job/new', postedAt: '2026-01-01T00:00:00.000Z' };
    const midJob: Job = { ...baseJob, company: 'Media', title: 'Media', link: 'https://gupy.io/job/mid', postedAt: '2025-01-01T00:00:00.000Z' };

    vi.mocked(runGupyStep).mockResolvedValue([oldJob, newJob, midJob]);
    vi.mocked(dedupEngine.mergeSources).mockReturnValue([oldJob, newJob, midJob]);

    await runPipeline('run-1', 'user-1', ['CorpA'], ['Designer'], true);

    expect(progressEmitter.emit).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ type: 'pipeline_complete', jobs: [newJob, midJob, oldJob] }),
    );
  });

  it('roda_expansao_tambem_para_usuario_anonimo', async () => {
    mockExpandQueries.mockResolvedValue(['Analista de Dados', 'Data Analyst']);
    await runPipeline('run-1', ANONYMOUS_USER_ID, [], ['Analista de Dados'], false);
    expect(mockExpandQueries).toHaveBeenCalledWith(['Analista de Dados']);
    expect(runGupyStep).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ queries: ['Analista de Dados', 'Data Analyst'] }),
    );
  });
});
