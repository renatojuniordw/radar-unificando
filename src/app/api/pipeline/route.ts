import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { pipelineLimiter, pipelineAutoLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { runPipeline, ANONYMOUS_USER_ID } from '@/lib/core/pipeline/pipeline-runner';
import { pipelineStartSchema } from '@/lib/core/pipeline/pipeline-schema';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || ANONYMOUS_USER_ID;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const rateLimitKey = session?.user?.id ? userId : `anon:${ip}`;

    const parsed = pipelineStartSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros de busca inválidos' },
        { status: 400 }
      );
    }
    const { companies, queries, auto } = parsed.data;

    // Auto-sync (refresh silencioso) usa limiter próprio e NÃO consome a cota
    // da busca manual — o usuário pode buscar na hora após entrar no site.
    const limiter = auto === true ? pipelineAutoLimiter : pipelineLimiter;
    const { allowed, retryAfter } = limiter.check(rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde entre execuções.', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const runId = crypto.randomUUID();
    const isLoggedIn = !!session?.user?.id;

    if (isLoggedIn) {
      await pipelineRunRepository.create({
        id: runId,
        userId,
        status: 'running',
        discoveryEnabled: false,
      });
    }

    progressEmitter.emit(runId, { type: 'step_start', step: 'Pipeline', message: 'Iniciando pipeline...' });

    runPipeline(runId, userId, companies || [], queries || [], isLoggedIn);

    return NextResponse.json({
      runId,
      cooldownSeconds: auto === true ? 0 : Math.ceil(pipelineLimiter.windowMs / 1000),
    });
  } catch (error) {
    console.error('[pipeline] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar pipeline' },
      { status: 500 }
    );
  }
}
