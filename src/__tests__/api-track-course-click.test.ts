import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/core/courses/course-track', () => ({ recordCourseClick: vi.fn() }));

import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { recordCourseClick } from '@/lib/core/courses/course-track';
import { POST } from '@/app/api/track/course-click/route';

function makeRequest(body: unknown, ip = '203.0.113.5'): NextRequest {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);
  return { headers, json: async () => body } as any;
}

describe('Track Course Click API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(recordCourseClick).mockResolvedValue(undefined as any);
  });

  it('should_return_429_when_rate_limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false } as any);
    const res = await POST(makeRequest({ courseId: 'c1' }));
    expect(res.status).toBe(429);
    expect(recordCourseClick).not.toHaveBeenCalled();
  });

  it('should_return_400_when_course_id_missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('courseId');
  });

  it('should_return_400_when_course_id_not_string', async () => {
    const res = await POST(makeRequest({ courseId: 123 }));
    expect(res.status).toBe(400);
  });

  it('should_record_click_with_default_origin_for_unknown_origin', async () => {
    const res = await POST(makeRequest({ courseId: 'c1', skill: 'Python', platform: 'Udemy', url: 'https://x.io' }));
    expect(res.status).toBe(200);
    expect(recordCourseClick).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        courseId: 'c1',
        skill: 'Python',
        platform: 'Udemy',
        origin: 'web',
        url: 'https://x.io',
        ipHash: expect.any(String),
      }),
    );
  });

  it('should_keep_allowed_origin', async () => {
    await POST(makeRequest({ courseId: 'c1', origin: 'chat' }));
    expect(recordCourseClick).toHaveBeenCalledWith(expect.objectContaining({ origin: 'chat' }));
  });

  it('should_use_session_user_id_when_authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    await POST(makeRequest({ courseId: 'c1' }));
    expect(recordCourseClick).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });

  it('should_truncate_fields_to_limits', async () => {
    await POST(makeRequest({
      courseId: 'c'.repeat(150),
      skill: 's'.repeat(150),
      platform: 'p'.repeat(50),
      url: 'u'.repeat(600),
    }));
    expect(recordCourseClick).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c'.repeat(100),
        skill: 's'.repeat(100),
        platform: 'p'.repeat(10),
        url: 'u'.repeat(500),
      }),
    );
  });

  it('should_tolerate_invalid_json_body', async () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '203.0.113.5');
    const req = { headers, json: vi.fn().mockRejectedValue(new Error('bad json')) } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('courseId');
  });
});