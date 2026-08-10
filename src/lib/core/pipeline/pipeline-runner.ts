import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { runGupyStep, shouldUseGupyMCP } from '@/lib/core/pipeline/steps/gupy-step';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import { runDiscoveryStep } from '@/lib/core/pipeline/steps/discovery-step';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';
import { runPublicSaveStep } from '@/lib/core/pipeline/steps/public-save-step';
import { dedupEngine } from '@/lib/core/dedup';

export const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface RunPipelineOptions {
  /** Habilita a descoberta de novas empresas (padrão: true para usuários logados). */
  discoveryEnabled?: boolean;
}

export async function runPipeline(
  runId: string,
  userId: string,
  companies: string[],
  queries: string[],
  isLoggedIn: boolean,
  options: RunPipelineOptions = {},
) {
  try {
    const discoveryEnabled = options.discoveryEnabled !== false && isLoggedIn;

    const [gupyJobs, inhireJobs, newCompaniesFound] = await Promise.all([
      runGupyStep(runId, { companies, isLoggedIn, queries }),
      runInHireStep(runId, { companies, queries }),
      discoveryEnabled ? runDiscoveryStep(runId, { companies, userId }) : Promise.resolve(0),
    ]);

    const allJobs = dedupEngine.mergeSources(gupyJobs, inhireJobs);

    // Pool público de vagas (SEO): alimentado em toda execução, logada ou anônima.
    await runPublicSaveStep(allJobs);

    if (isLoggedIn && userId !== ANONYMOUS_USER_ID) {
      await runSaveStep(runId, allJobs, {
        userId,
        source: shouldUseGupyMCP(isLoggedIn, queries) ? 'gupy_mcp' : 'gupy_api',
      });
    }

    if (isLoggedIn) {
      await pipelineRunRepository.update(runId, {
        status: 'completed',
        totalJobs: allJobs.length,
        gupyJobs: gupyJobs.length,
        inhireJobs: inhireJobs.length,
        newCompaniesFound,
        finishedAt: new Date(),
      });
    }

    progressEmitter.emit(runId, {
      type: 'pipeline_complete',
      message: `Busca concluída! ${allJobs.length} vaga(s) encontrada(s).`,
      ...(isLoggedIn ? {} : { jobs: allJobs }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    progressEmitter.emit(runId, {
      type: 'step_error', step: 'Pipeline', error: message,
      message: `Falha: ${message}`,
    });
    progressEmitter.emit(runId, { type: 'pipeline_error', message: 'Pipeline falhou' });

    if (isLoggedIn) {
      await pipelineRunRepository.update(runId, {
        status: 'failed',
        finishedAt: new Date(),
      });
    }
  }
}
