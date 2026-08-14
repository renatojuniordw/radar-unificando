import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { isRedisReady, redisClient } from '@/lib/infrastructure/redis/client';
import { searchUdemyCourses } from '@/lib/core/courses/impact-client';
import { getCourseProvider } from '@/lib/core/courses/course-provider';

const searchSchema = z.object({
  query: z.string().trim().min(1, 'Informe um termo de busca').max(80),
});

const CACHE_TTL_SECONDS = 3600;

/**
 * Busca dinâmica de cursos. Prioriza a API Impact (Udemy avulsos), com cache
 * Redis e fallback para o catálogo curado local.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const limit = await checkRateLimit(ip, 'general');
  if (!limit.success) {
    return NextResponse.json({ error: 'Limite de requisições atingido' }, { status: 429 });
  }

  const parsed = searchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Termo de busca inválido' }, { status: 400 });
  }
  const query = parsed.data.query;

  const cacheKey = `impact_search:${createHash('sha256').update(query).digest('hex')}`;

  // Cache (fail-open: se o Redis cair, busca direto na API).
  if (isRedisReady()) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached) as unknown);
      }
    } catch {
      // segue sem cache
    }
  }

  const impactCourses = await searchUdemyCourses(query, 12);

  let courses = impactCourses;
  let source: 'impact' | 'curated' = 'impact';
  if (courses.length === 0) {
    // Fallback: catálogo curado local.
    courses = await getCourseProvider().searchCourses(query);
    source = 'curated';
  }

  const body = { courses, source };

  if (isRedisReady() && source === 'impact') {
    try {
      await redisClient.set(cacheKey, JSON.stringify(body), 'EX', CACHE_TTL_SECONDS);
    } catch {
      // cache é best-effort
    }
  }

  return NextResponse.json(body);
}
