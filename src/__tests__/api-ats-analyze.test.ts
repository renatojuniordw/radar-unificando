import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAuth: mockRequireAuth } = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock('@/lib/api/auth-guard', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/core/ai/ats/ats-service', () => ({
  analyzeAtsWithCache: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { analyzeAtsWithCache } from '@/lib/core/ai/ats/ats-service';
import { POST } from '@/app/api/ats/analyze/route';

function makeRequest(body: unknown = {}) {
  return { json: async () => body, headers: new Headers() } as any;
}

const ATS_RESULT = {
  heuristics: { checks: [], score: 80 },
  analysis: {
    score: 72,
    summary: 'Currículo bom.',
    strengths: ['Contato presente'],
    missingKeywords: ['AWS'],
    formattingIssues: [],
    recommendations: ['Adicione keywords'],
    skillScores: [],
  },
  cached: false,
};

describe('ATS Analyze API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: 'user-1' } }, response: null });
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      remainingPoints: 9,
      msBeforeNext: 0,
    } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Currículo com experiência em desenvolvimento por mais de trinta caracteres.',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue(ATS_RESULT as any);
  });

  it('should_return_401_when_unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({
      session: null,
      response: new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 }),
    });
    const res = await POST(makeRequest({ jobDescription: 'Vaga' }));
    expect(res.status).toBe(401);
  });

  it('should_return_429_when_rate_limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      msBeforeNext: 30000,
      remainingPoints: 0,
    } as any);
    const res = await POST(makeRequest({ jobDescription: 'Vaga' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
    expect(analyzeAtsWithCache).not.toHaveBeenCalled();
  });

  it('should_return_400_when_no_resume', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const res = await POST(makeRequest({ jobDescription: 'Vaga' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Nenhum currículo');
  });

  it('should_return_analysis_on_success', async () => {
    const res = await POST(makeRequest({ jobDescription: 'Vaga de desenvolvedor React' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis.score).toBe(72);
    expect(body.analysis.missingKeywords).toContain('AWS');
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      expect.stringContaining('Currículo'),
      expect.objectContaining({ jobDescription: 'Vaga de desenvolvedor React' }),
    );
  });

  it('should_pass_job_description_undefined_when_absent', async () => {
    await POST(makeRequest({}));
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      expect.stringContaining('Currículo'),
      expect.objectContaining({ jobDescription: undefined }),
    );
  });
});