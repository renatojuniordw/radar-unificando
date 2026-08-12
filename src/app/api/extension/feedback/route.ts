import { NextRequest, NextResponse } from 'next/server';
import { recordFeedback } from '@/lib/core/extension/extension-feedback';
import { findUserIdByExtensionToken } from '@/lib/core/extension/extension-token';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { extractBearerToken } from '@/lib/api/auth-guard';

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

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const rateLimitKey = `ext:${userId}:${ip.split(',')[0].trim()}`;
  const { success, msBeforeNext } = await checkRateLimit(rateLimitKey, 'extension');

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return new Response(
      JSON.stringify({ error: `Muitas solicitações. Tente novamente em ${retryAfterSeconds} segundos.` }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const rating = body?.rating;
    if (typeof rating !== 'boolean') {
      return NextResponse.json({ error: 'Campo "rating" deve ser booleano.' }, { status: 400 });
    }
    const comment = typeof body?.comment === 'string' ? body.comment : undefined;

    await recordFeedback({ userId, rating, comment });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[extension] Erro ao registrar feedback:', error);
    return NextResponse.json({ error: 'Erro ao registrar feedback' }, { status: 500 });
  }
}