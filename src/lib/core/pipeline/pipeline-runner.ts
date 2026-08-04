import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';
import { dedupEngine } from '@/lib/core/dedup';

export const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function runPipeline(
  runId: string,
  userId: string,
  companies: string[],
  queries: string[],
  isLoggedIn: boolean,
) {
  try {
    const [gupyJobs, inhireJobs] = await Promise.all([
      runGupyStep(runId, { companies, isLoggedIn, queries }),
      runInHireStep(runId, { companies, queries }),
    ]);

    const allJobs = dedupEngine.mergeSources(gupyJobs, inhireJobs);

    if (isLoggedIn && userId !== ANONYMOUS_USER_ID) {
      await runSaveStep(runId, allJobs, {
        userId,
        source: isLoggedIn ? 'gupy_mcp' : 'gupy_api',
      });
    }

    if (isLoggedIn) {
      await pipelineRunRepository.update(runId, {
        status: 'completed',
        totalJobs: allJobs.length,
        gupyJobs: gupyJobs.length,
        inhireJobs: inhireJobs.length,
        newCompaniesFound: 0,
        finishedAt: new Date(),
      });
    }

    progressEmitter.emit(runId, {
      type: 'pipeline_complete',
      message: `Pipeline concluído! ${allJobs.length} vagas encontradas (Gupy: ${gupyJobs.length}, InHire: ${inhireJobs.length})`,
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
