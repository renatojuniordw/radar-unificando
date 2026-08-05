import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { upsert: vi.fn() },
}));
vi.mock('@/lib/infrastructure/security/rate-limiter', () => ({
  uploadLimiter: { check: vi.fn() },
}));
vi.mock('@/lib/core/ai/skill-extractor', () => ({
  extractSkillsFromResume: vi.fn(),
}));
vi.mock('@/lib/core/parsing/pdf-to-markdown', () => ({
  pdfToMarkdown: vi.fn().mockResolvedValue('## Skills\npython, sql'),
  textToMarkdown: vi.fn().mockImplementation((t: string) => t),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { uploadLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';
import { POST } from '@/app/api/upload/route';

function makeFormRequest(formEntries: Record<string, any>): any {
  const formData = new Map<string, any>();
  Object.entries(formEntries).forEach(([k, v]) => formData.set(k, v));
  return {
    formData: async () => ({
      get: (key: string) => formData.get(key) ?? null,
    }),
  } as any;
}

describe('Upload API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeFormRequest({}));
    expect(res.status).toBe(401);
  });

  it('should_return_429_when_rate_limited', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(uploadLimiter.check).mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 3600000, retryAfter: 3600 });
    const res = await POST(makeFormRequest({}));
    expect(res.status).toBe(429);
  });

  it('should_return_400_when_text_too_short', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(uploadLimiter.check).mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600000, retryAfter: 0 });
    const res = await POST(makeFormRequest({ text: 'short' }));
    expect(res.status).toBe(400);
  });

  it('should_extract_and_save_from_direct_text', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(uploadLimiter.check).mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600000, retryAfter: 0 });
    vi.mocked(extractSkillsFromResume).mockResolvedValue({
      skills: ['python', 'sql'], experienceYears: 5, seniority: 'senior', education: ['Computer Science'], currentRole: null, area: null,
    });
    vi.mocked(profileRepository.upsert).mockResolvedValue();
    const res = await POST(makeFormRequest({ text: 'Senior data analyst with python and sql skills' }));
    const body = await res.json();
    expect(body.skills).toContain('python');
    expect(body.experience).toBe(5);
    expect(body.count).toBe(2);
  });

  it('should_return_500_on_unexpected_error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(uploadLimiter.check).mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600000, retryAfter: 0 });
    vi.mocked(extractSkillsFromResume).mockResolvedValue({
      skills: ['python', 'sql'], experienceYears: 5, seniority: 'senior', education: ['Computer Science'], currentRole: null, area: null,
    });
    vi.mocked(profileRepository.upsert).mockRejectedValue(new Error('DB error'));
    const res = await POST(makeFormRequest({ text: 'Senior data analyst with python and sql skills for five years' }));
    expect(res.status).toBe(500);
  });
});