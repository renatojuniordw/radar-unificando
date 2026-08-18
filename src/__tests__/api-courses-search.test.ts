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
import { isRedisReady, redisClient } from '@/lib/infrastructure/redis/client';
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

  it('should_return_courses_from_impact_api', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([impactCourse]);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('impact');
    expect(body.courses).toHaveLength(1);
    expect(body.courses[0].id).toBe('impact-udemy-1');
  });

  it('should_fall_back_to_curated_catalog_when_impact_is_empty', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([]);
    const res = await POST(makeRequest({ query: 'excel' }));
    const body = await res.json();
    expect(body.source).toBe('curated');
    expect(body.courses.length).toBeGreaterThan(0);
  });

  it('should_return_429_when_rate_limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, retryAfter: 60 } as never);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(429);
    expect(searchUdemyCourses).not.toHaveBeenCalled();
  });

  it('should_return_400_for_invalid_query', async () => {
    const res = await POST(makeRequest({ query: '' }));
    expect(res.status).toBe(400);
    expect(searchUdemyCourses).not.toHaveBeenCalled();
  });

  it('should_return_cached_results_when_redis_hits', async () => {
    vi.mocked(isRedisReady).mockReturnValue(true);
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify({ courses: [impactCourse], source: 'impact' }));
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.courses[0].id).toBe('impact-udemy-1');
    expect(searchUdemyCourses).not.toHaveBeenCalled();
  });

  it('should_cache_impact_results_when_redis_ready', async () => {
    vi.mocked(isRedisReady).mockReturnValue(true);
    vi.mocked(redisClient.get).mockResolvedValue(null);
    vi.mocked(searchUdemyCourses).mockResolvedValue([impactCourse]);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
    expect(redisClient.set).toHaveBeenCalledWith(
      expect.stringContaining('impact_search:'),
      expect.any(String),
      'EX',
      3600,
    );
  });

  it('should_continue_without_cache_when_redis_read_fails', async () => {
    vi.mocked(isRedisReady).mockReturnValue(true);
    vi.mocked(redisClient.get).mockRejectedValue(new Error('redis down'));
    vi.mocked(searchUdemyCourses).mockResolvedValue([impactCourse]);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
    expect(searchUdemyCourses).toHaveBeenCalled();
  });

  it('should_not_fail_when_cache_write_fails', async () => {
    vi.mocked(isRedisReady).mockReturnValue(true);
    vi.mocked(redisClient.get).mockResolvedValue(null);
    vi.mocked(redisClient.set).mockRejectedValue(new Error('redis down'));
    vi.mocked(searchUdemyCourses).mockResolvedValue([impactCourse]);
    const res = await POST(makeRequest({ query: 'python' }));
    expect(res.status).toBe(200);
  });
});
