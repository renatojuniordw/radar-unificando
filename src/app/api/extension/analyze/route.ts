import { NextRequest, NextResponse } from 'next/server';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache } from '@/lib/ats/ats-service';
import { findUserIdByExtensionToken } from '@/lib/core/extension/extension-token';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_JOB_DESCRIPTION = 8000;

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Token de extensão ausente' }, { status: 401 });
  }

  let userId: string;
  try {
    const resolved = await findUserIdByExtensionToken(token);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Token de extensão inválido ou revogado' },
        { status: 401 }
      );
    }
    userId = resolved;
  } catch (error) {
    console.error('[extension] Erro ao validar token:', error);
    return NextResponse.json({ error: 'Erro ao validar token' }, { status: 500 });
  }

  // Rate limiting por minuto (20 análises/min por usuário+IP)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const rateLimitKey = `ext:${userId}:${ip.split(',')[0].trim()}`;
  const { success, msBeforeNext, remainingPoints } = await checkRateLimit(rateLimitKey, 'extension');

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return new Response(
      JSON.stringify({ error: `Muitas solicitações. Tente novamente em ${retryAfterSeconds} segundos.` }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Remaining': String(remainingPoints),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const jobDescription =
      typeof body?.jobDescription === 'string'
        ? body.jobDescription.slice(0, MAX_JOB_DESCRIPTION)
        : undefined;

    const profile = await profileRepository.findByUserId(userId);
    const resumeText = profile?.resumeText || profile?.resumeMarkdown || '';
    if (!resumeText || resumeText.length < 30) {
      return NextResponse.json(
        { error: 'Nenhum currículo encontrado. Importe seu currículo primeiro.' },
        { status: 400 }
      );
    }

    const result = await analyzeAtsWithCache(userId, resumeText, {
      jobDescription,
      traceId: crypto.randomUUID(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[extension] Erro na análise:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao analisar o currículo: ${message.slice(0, 300)}` },
      { status: 500 }
    );
  }
}