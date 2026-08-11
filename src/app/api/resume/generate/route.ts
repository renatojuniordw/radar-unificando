import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import {
  generateAdaptedResume,
  adaptedResumeToMarkdown,
  type AdaptedResume,
} from '@/lib/core/ai/resume-adaptation-generator';
import { RESUME_ADAPTATION_PROMPT_VERSION } from '@/lib/core/ai/prompts/resume-adaptation';
import { computeCacheKey, getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { renderResumePdf } from '@/lib/pdf/render-resume-pdf';

export const runtime = 'nodejs';

const MAX_JOB_TITLE = 300;
const MAX_JOB_DESCRIPTION = 8000;
const MAX_JOB_COMPANY = 300;
const MAX_JOB_LOCATION = 300;

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const { success, msBeforeNext, remainingPoints } = await checkRateLimit(
    `${session.user.id}:${ip.split(',')[0].trim()}`,
    'resume_daily',
  );

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return new Response(
      JSON.stringify({
        error: `Limite diário de currículos gerados atingido. Tente novamente em ${retryAfterSeconds} segundos.`,
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
    const jobTitle = str(body?.jobTitle, MAX_JOB_TITLE);
    const jobDescription = str(body?.jobDescription, MAX_JOB_DESCRIPTION);
    const jobCompany = str(body?.jobCompany, MAX_JOB_COMPANY);
    const jobLocation = str(body?.jobLocation, MAX_JOB_LOCATION);

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Título da vaga é obrigatório.' },
        { status: 400 },
      );
    }

    const profile = await profileRepository.findByUserId(session.user.id);
    const resumeContext = profile?.resumeMarkdown || profile?.resumeText || '';
    if (!resumeContext || resumeContext.length < 30) {
      return NextResponse.json(
        { error: 'Nenhum currículo encontrado. Importe seu currículo primeiro.' },
        { status: 400 },
      );
    }

    const cacheKey = computeCacheKey(RESUME_ADAPTATION_PROMPT_VERSION, [
      jobTitle,
      jobDescription,
      jobCompany,
      jobLocation,
      resumeContext,
    ]);

    let resume = await getCached<AdaptedResume>(session.user.id, 'resume_adaptation', cacheKey);

    if (!resume) {
      resume = await generateAdaptedResume(resumeContext, jobTitle, jobDescription, {
        jobCompany,
        jobLocation,
        traceId: crypto.randomUUID(),
      });
      await saveToCache(session.user.id, 'resume_adaptation', cacheKey, resume);
    }

    const pdf = await renderResumePdf(resume);

    return NextResponse.json({
      resume,
      resumeMarkdown: adaptedResumeToMarkdown(resume),
      pdfBase64: pdf.toString('base64'),
    });
  } catch (error) {
    console.error('[resume] Erro na geração:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao gerar o currículo: ${message.slice(0, 300)}` },
      { status: 500 },
    );
  }
}