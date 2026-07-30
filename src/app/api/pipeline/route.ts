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
    const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const rateLimitKey = session?.user?.id ? userId : `anon:${ip}`;

    const { allowed, remaining } = pipelineLimiter.check(rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 5 minutos entre execuções.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    const { companies, discoveryEnabled } = await req.json();

    const runId = crypto.randomUUID();
    const isLoggedIn = !!session?.user?.id;

    if (isLoggedIn) {
      await pipelineRunRepository.create({
        id: runId,
        userId,
        status: 'running',
        discoveryEnabled: discoveryEnabled !== false,
      });
    }

    progressEmitter.emit(runId, { type: 'step_start', step: 'Pipeline', message: 'Iniciando pipeline...' });

    runPipeline(runId, userId, companies || [], discoveryEnabled !== false, isLoggedIn);

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
    if (isLoggedIn && userId !== '00000000-0000-0000-0000-000000000000') {
      inserted = await runSaveStep(runId, allJobs, {
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
        newCompaniesFound: discoveryCount,
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
