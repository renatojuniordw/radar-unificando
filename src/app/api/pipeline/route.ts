import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { pipelineLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { runGupyStep } from '@/lib/core/pipeline/steps/gupy-step';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';
import { runDiscoveryStep } from '@/lib/core/pipeline/steps/discovery-step';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';
import { dedupEngine } from '@/lib/core/dedup';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    const { allowed, remaining } = pipelineLimiter.check(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 5 minutos entre execuções.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    const { companies, discoveryEnabled } = await req.json();

    const runId = crypto.randomUUID();

    await pipelineRunRepository.create({
      id: runId,
      userId,
      status: 'running',
      discoveryEnabled: discoveryEnabled !== false,
    });

    progressEmitter.emit(runId, { type: 'step_start', step: 'Pipeline', message: 'Iniciando pipeline...' });

    runPipeline(runId, userId, companies || [], discoveryEnabled !== false, !!session?.user?.id);

    return NextResponse.json({ runId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar pipeline' },
      { status: 500 }
    );
  }
}

async function runPipeline(
  runId: string,
  userId: string,
  companies: string[],
  discoveryEnabled: boolean,
  isLoggedIn: boolean
) {
  try {
    const [gupyJobs, inhireJobs] = await Promise.all([
      runGupyStep(runId, { companies, isLoggedIn }),
      runInHireStep(runId, { companies }),
    ]);

    let discoveryCount = 0;
    if (discoveryEnabled && isLoggedIn && companies.length > 0) {
      discoveryCount = await runDiscoveryStep(runId, { companies });
    }

    const allJobs = dedupEngine.mergeSources(gupyJobs, inhireJobs);

    let inserted = 0;
    if (isLoggedIn && userId !== 'anonymous') {
      inserted = await runSaveStep(runId, allJobs, {
        userId,
        source: isLoggedIn ? 'gupy_mcp' : 'gupy_api',
      });
    }

    await pipelineRunRepository.update(runId, {
      status: 'completed',
      totalJobs: allJobs.length,
      gupyJobs: gupyJobs.length,
      inhireJobs: inhireJobs.length,
      newCompaniesFound: discoveryCount,
      finishedAt: new Date(),
    });

    progressEmitter.emit(runId, {
      type: 'pipeline_complete',
      message: `Pipeline concluído! ${allJobs.length} vagas encontradas (Gupy: ${gupyJobs.length}, InHire: ${inhireJobs.length})`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    progressEmitter.emit(runId, {
      type: 'step_error', step: 'Pipeline', error: message,
      message: `Falha: ${message}`,
    });
    progressEmitter.emit(runId, { type: 'pipeline_error', message: 'Pipeline falhou' });

    await pipelineRunRepository.update(runId, {
      status: 'failed',
      finishedAt: new Date(),
    });
  }
}
