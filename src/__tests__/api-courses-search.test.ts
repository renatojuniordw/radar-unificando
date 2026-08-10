import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/redis/client', () => ({
  isRedisReady: vi.fn(() => false),
  redisClient: { get: vi.fn(), set: vi.fn() },
}));
vi.mock('@/lib/core/courses/impact-client', () => ({
  searchUdemyCourses: vi.fn(),
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { searchUdemyCourses } from '@/lib/core/courses/impact-client';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { POST } from '@/app/api/courses/search/route';
import type { NextRequest } from 'next/server';
import type { Course } from '@/lib/core/courses/course-provider';

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost:11010/api/courses/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const impactCourse: Course = {
  id: 'impact-udemy-1',
  provider: 'udemy',
  title: 'Curso Avulso de Python',
  description: '',
  skillTags: ['python'],
  priceLabel: 'R$ 39,90',
  url: 'https://www.udemy.com/course/python-avulso',
};

describe('POST /api/courses/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as never);
  });

  it('deve_retornar_cursos_da_api_impact', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([impactCourse]);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('impact');
    expect(body.courses).toHaveLength(1);
    expect(body.courses[0].id).toBe('impact-udemy-1');
  });

  it('deve_cair_para_curado_quando_impact_retorna_vazio', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([]);
    const res = await POST(makeRequest({ query: 'excel' }));
    const body = await res.json();
    expect(body.source).toBe('curated');
    expect(body.courses.length).toBeGreaterThan(0);
  });

  it('deve_retornar_429_quando_rate_limit', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, retryAfter: 60 } as never);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(429);
    expect(searchUdemyCourses).not.toHaveBeenCalled();
  });

  it('deve_retornar_400_para_query_invalida', async () => {
    const res = await POST(makeRequest({ query: '' }));
    expect(res.status).toBe(400);
    expect(searchUdemyCourses).not.toHaveBeenCalled();
  });
});
