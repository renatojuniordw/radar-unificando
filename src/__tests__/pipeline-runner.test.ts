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

import { runPipeline, ANONYMOUS_USER_ID } from '@/lib/core/pipeline/pipeline-runner';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';

describe('runPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscovery.mockResolvedValue(3);
    vi.mocked(runGupyStep).mockResolvedValue([]);
  });

  it('nao_roda_discovery_para_usuario_anonimo_e_nao_grava_run', async () => {
    await runPipeline('run-1', ANONYMOUS_USER_ID, ['CorpA'], [], false);
    expect(mockDiscovery).not.toHaveBeenCalled();
    expect(pipelineRunRepository.update).not.toHaveBeenCalled();
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
});
