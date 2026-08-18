import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache, buildAtsResumeInput } from '@/lib/core/ai/ats/ats-service';
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
        error: 'Limite diário de análises ATS atingido.',
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSeconds,
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
    const jobKey = typeof body?.jobKey === 'string' ? body.jobKey.slice(0, 300) : undefined;

    const profile = await profileRepository.findByUserId(session.user.id);
    const rawResumeText = profile?.resumeText || profile?.resumeMarkdown || '';
    if (!rawResumeText || rawResumeText.length < 30) {
      return NextResponse.json(
        { error: 'Nenhum currículo encontrado. Importe seu currículo primeiro.' },
        { status: 400 }
      );
    }
    const resumeText = buildAtsResumeInput(profile!);

    const result = await analyzeAtsWithCache(session.user.id, resumeText, {
      jobDescription,
      jobKey,
      traceId: crypto.randomUUID(),
    });

    return NextResponse.json(result);
  } catch (error) {
    // O detalhe fica apenas no log do servidor — não expomos error.message ao
    // client (pode conter URLs internas/nomes de provedor) (relatório item 2.6).
    console.error('[ats] Erro na análise:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar o currículo.' },
      { status: 500 }
    );
  }
}
