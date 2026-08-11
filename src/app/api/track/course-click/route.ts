import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { recordCourseClick } from '@/lib/core/courses/course-track';

const ALLOWED_ORIGINS = new Set(['web', 'chat', 'sidebar', 'cursos', 'extension']);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Registra cliques em links de cursos de afiliado (Udemy).
 * Público (sem login), limitado por IP — só analytics, nunca bloqueia a navegação.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, 'general');
  if (!limit.success) {
    return NextResponse.json({ error: 'Limite de requisições atingido' }, { status: 429 });
  }

  const session = await auth().catch(() => null);
  const body = (await req.json().catch(() => ({}))) as {
    courseId?: string;
    skill?: string;
    platform?: string;
    origin?: string;
    url?: string;
  };

  if (!body.courseId || typeof body.courseId !== 'string') {
    return NextResponse.json({ error: 'Campo "courseId" é obrigatório.' }, { status: 400 });
  }

  const origin = ALLOWED_ORIGINS.has(body.origin || '') ? body.origin! : 'web';

  await recordCourseClick({
    userId: session?.user?.id ?? null,
    courseId: body.courseId.slice(0, 100),
    skill: body.skill?.slice(0, 100) ?? null,
    platform: body.platform?.slice(0, 10) ?? null,
    origin,
    url: body.url?.slice(0, 500) ?? null,
    ipHash: createHash('sha256').update(ip).digest('hex'),
  });

  return NextResponse.json({ ok: true });
}
