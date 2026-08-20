import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { runGupyStep, shouldUseGupyMCP } from '@/lib/core/pipeline/steps/gupy-step';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import { runDiscoveryStep } from '@/lib/core/pipeline/steps/discovery-step';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';
import { runPublicSaveStep } from '@/lib/core/pipeline/steps/public-save-step';
import { dedupEngine } from '@/lib/core/dedup';
import { pipelineCache } from '@/lib/infrastructure/cache/pipeline-cache';
import { expandQueries } from '@/lib/core/pipeline/query-expansion/service';
import { sortJobsByRecency } from '@/lib/utils/date';
export const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface RunPipelineOptions {
  /** Habilita a descoberta de novas empresas (padrão: true para usuários logados). */
  discoveryEnabled?: boolean;
}

/**
 * Dependências injetáveis do pipeline.
 * Permite testes com mocks sem acoplamento a implementações concretas.
 */
export interface PipelineDeps {
  runGupyStep: typeof runGupyStep;
  runInHireStep: typeof runInHireStep;
  runDiscoveryStep: typeof runDiscoveryStep;
  runSaveStep: typeof runSaveStep;
  runPublicSaveStep: typeof runPublicSaveStep;
  dedupEngine: typeof dedupEngine;
  pipelineCache: typeof pipelineCache;
  pipelineRunRepository: typeof pipelineRunRepository;
  progressEmitter: typeof progressEmitter;
  expandQueries: typeof expandQueries;
  sortJobsByRecency: typeof sortJobsByRecency;
  shouldUseGupyMCP: typeof shouldUseGupyMCP;
}

const defaultDeps: PipelineDeps = {
  runGupyStep,
  runInHireStep,
  runDiscoveryStep,
  runSaveStep,
  runPublicSaveStep,
  dedupEngine,
  pipelineCache,
  pipelineRunRepository,
  progressEmitter,
  expandQueries,
  sortJobsByRecency,
  shouldUseGupyMCP,
};

async function fetchFreshJobs(
  runId: string,
  userId: string,
  companies: string[],
  queries: string[],
  isLoggedIn: boolean,
  discoveryEnabled: boolean,
  deps: PipelineDeps,
) {
  const expandedQueries = await deps.expandQueries(queries);
  const [gupyJobs, inhireJobs, discCount] = await Promise.all([
    deps.runGupyStep(runId, {
      companies,
      isLoggedIn,
      queries: expandedQueries,
      relevanceQueries: queries,
    }),
    deps.runInHireStep(runId, { companies, queries }),
    discoveryEnabled ? deps.runDiscoveryStep(runId, { companies, userId }) : Promise.resolve(0),
  ]);

  const allJobs = deps.sortJobsByRecency(deps.dedupEngine.mergeSources(gupyJobs, inhireJobs));
  deps.pipelineCache.set(companies, queries, allJobs);
  return {
    allJobs,
    gupyCount: gupyJobs.length,
    inhireCount: inhireJobs.length,
    newCompaniesFound: discCount,
  };
}

export async function runPipeline(
  runId: string,
  userId: string,
  companies: string[],
  queries: string[],
  isLoggedIn: boolean,
  options: RunPipelineOptions = {},
  deps: PipelineDeps = defaultDeps,
) {
  try {
    const discoveryEnabled = options.discoveryEnabled !== false && isLoggedIn;

    const { jobs: cachedJobs, isStale } = deps.pipelineCache.get(companies, queries);
    let allJobs;
    let gupyCount = 0;
    let inhireCount = 0;
    let newCompaniesFound = 0;

    if (cachedJobs !== null) {
      deps.progressEmitter.emit(runId, {
        type: 'step_complete',
        step: 'Cache',
        message: `Resultados obtidos em cache (${cachedJobs.length} vagas encontradas)${isStale ? ' - atualizando em segundo plano...' : ''}`,
      });
      allJobs = cachedJobs;

      if (isStale) {
        // Stale-While-Revalidate: revalida em segundo plano sem bloquear a resposta ao usuário
        void fetchFreshJobs(runId, userId, companies, queries, isLoggedIn, discoveryEnabled, deps).catch((err) => {
          console.warn('[pipeline-runner] Error during background revalidation:', err);
        });
      }
    } else {
      const fresh = await fetchFreshJobs(runId, userId, companies, queries, isLoggedIn, discoveryEnabled, deps);
      allJobs = fresh.allJobs;
      gupyCount = fresh.gupyCount;
      inhireCount = fresh.inhireCount;
      newCompaniesFound = fresh.newCompaniesFound;
    }

    // Pool público de vagas (SEO): alimentado em toda execução, logada ou anônima.
    await deps.runPublicSaveStep(allJobs);

    if (isLoggedIn && userId !== ANONYMOUS_USER_ID) {
      await deps.runSaveStep(runId, allJobs, {
        userId,
        source: deps.shouldUseGupyMCP(isLoggedIn, queries) ? 'gupy_mcp' : 'gupy_api',
      });
    }

    // Atualiza também runs anônimos (registrados para métricas do painel admin)
    await deps.pipelineRunRepository.update(runId, {
      status: 'completed',
      totalJobs: allJobs.length,
      gupyJobs: gupyCount,
      inhireJobs: inhireCount,
      newCompaniesFound,
      finishedAt: new Date(),
    });

    deps.progressEmitter.emit(runId, {
      type: 'pipeline_complete',
      message: `Busca concluída! ${allJobs.length} vaga(s) encontrada(s).`,
      jobs: allJobs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    deps.progressEmitter.emit(runId, {
      type: 'step_error', step: 'Pipeline', error: message,
      message: `Falha: ${message}`,
    });
    deps.progressEmitter.emit(runId, { type: 'pipeline_error', message: 'Pipeline falhou' });

    await deps.pipelineRunRepository.update(runId, {
      status: 'failed',
      finishedAt: new Date(),
    });
  }
}
