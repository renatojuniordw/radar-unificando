import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache } from '@/lib/core/ai/ats/ats-service';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

const MAX_JOB_DESCRIPTION = 8000;

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const { success, msBeforeNext, remainingPoints } = await checkRateLimit(
    `${session.user.id}:${ip.split(',')[0].trim()}`,
    'ats_daily',
  );

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return new Response(
      JSON.stringify({
        error: `Limite diário de análises ATS atingido. Tente novamente em ${retryAfterSeconds} segundos.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Remaining': String(remainingPoints),
        },
      },
    );
  }

  try {
    const body = await req.json();
    const jobDescription =
      typeof body?.jobDescription === 'string'
        ? body.jobDescription.slice(0, MAX_JOB_DESCRIPTION)
        : undefined;

    const profile = await profileRepository.findByUserId(session.user.id);
    const resumeText = profile?.resumeText || profile?.resumeMarkdown || '';
    if (!resumeText || resumeText.length < 30) {
      return NextResponse.json(
        { error: 'Nenhum currículo encontrado. Importe seu currículo primeiro.' },
        { status: 400 }
      );
    }

    const result = await analyzeAtsWithCache(session.user.id, resumeText, {
      jobDescription,
      traceId: crypto.randomUUID(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ats] Erro na análise:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    // Mensagem segura para diagnóstico (não expõe headers/chaves — vem do zod/llm-provider)
    return NextResponse.json(
      { error: `Erro ao analisar o currículo: ${message.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
