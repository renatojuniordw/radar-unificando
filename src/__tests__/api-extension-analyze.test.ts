import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findUserIdByExtensionToken: mockFindUser } = vi.hoisted(() => ({
  findUserIdByExtensionToken: vi.fn(),
}));

vi.mock('@/lib/core/extension/extension-token', () => ({
  findUserIdByExtensionToken: mockFindUser,
}));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/ats/ats-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/ats/ats-service')>()),
  analyzeAtsWithCache: vi.fn(),
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache } from '@/lib/core/ai/ats/ats-service';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { POST } from '@/app/api/extension/analyze/route';

function makeRequest(auth?: string, body: unknown = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  return { json: async () => body, headers } as any;
}

describe('Extension Analyze API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_401_when_no_bearer_token', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('should_return_401_when_token_invalid', async () => {
    mockFindUser.mockResolvedValue(null);
    const res = await POST(makeRequest('Bearer invalid-token'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('inválido');
  });

  it('should_return_400_when_no_resume', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);

    const res = await POST(makeRequest('Bearer valid-token', { jobDescription: 'Vaga' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Nenhum currículo');
  });

  it('should_return_429_when_rate_limited', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      msBeforeNext: 30000,
      remainingPoints: 0,
    } as any);

    const res = await POST(makeRequest('Bearer valid-token', { jobDescription: 'Vaga' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('should_return_analysis_on_success', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Currículo com experiência em desenvolvimento de software por mais de trinta caracteres.',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue({
      heuristics: { checks: [], score: 80 },
      analysis: { score: 75, summary: 'ok', strengths: [], missingKeywords: [], formattingIssues: [], recommendations: [] },
      cached: false,
    } as any);

    const res = await POST(makeRequest('Bearer valid-token', { jobDescription: 'Vaga de dev' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis.score).toBe(75);
    expect(body.courses).toEqual([]);
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      expect.stringContaining('Currículo'),
      expect.objectContaining({ jobDescription: 'Vaga de dev' })
    );
  });

  it('should_include_courses_when_missing_keywords_present', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Currículo com experiência em desenvolvimento de software por mais de trinta caracteres.',
      area: 'Desenvolvimento',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue({
      heuristics: { checks: [], score: 80 },
      analysis: {
        score: 75,
        summary: 'ok',
        strengths: [],
        missingKeywords: ['Kubernetes', 'Docker'],
        formattingIssues: [],
        recommendations: [],
      },
      cached: false,
    } as any);

    const res = await POST(makeRequest('Bearer valid-token', { jobDescription: 'Vaga de dev' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.courses)).toBe(true);
    expect(body.courses.length).toBeGreaterThan(0);
    expect(body.courses.length).toBeLessThanOrEqual(3);
    for (const curso of body.courses) {
      expect(typeof curso.titulo).toBe('string');
      expect(curso.plataforma).toBe('Udemy');
      expect(typeof curso.skill).toBe('string');
      expect(typeof curso.preco).toBe('string');
      expect(curso.url.startsWith('https://')).toBe(true);
    }
  });

  it('should_return_empty_courses_when_no_missing_keywords', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Currículo com experiência em desenvolvimento de software por mais de trinta caracteres.',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue({
      heuristics: { checks: [], score: 80 },
      analysis: {
        score: 90,
        summary: 'ok',
        strengths: [],
        missingKeywords: [],
        formattingIssues: [],
        recommendations: [],
      },
      cached: false,
    } as any);

    const res = await POST(makeRequest('Bearer valid-token', { jobDescription: 'Vaga de dev' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.courses).toEqual([]);
  });
});