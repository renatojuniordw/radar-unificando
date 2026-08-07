import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache } from '@/lib/ats/ats-service';

const MAX_JOB_DESCRIPTION = 8000;

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

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
