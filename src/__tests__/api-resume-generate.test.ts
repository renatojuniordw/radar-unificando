import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireAuth: mockRequireAuth } = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock('@/lib/api/auth-guard', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/core/ai/resume-adaptation-generator', () => ({
  generateAdaptedResume: vi.fn(),
  adaptedResumeToMarkdown: vi.fn(),
}));
vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: vi.fn(() => 'cache-key'),
  getCached: vi.fn(),
  saveToCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/ats/ats-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/ats/ats-service')>()),
  analyzeAtsWithCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/resume-veracity', () => ({
  enforceVeracity: vi.fn((_original: string, resume: unknown) => ({ resume, removed: { companies: [], roles: [], institutions: [], certifications: [] } })),
}));
vi.mock('@/lib/pdf/render-resume-pdf', () => ({
  renderResumePdf: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import {
  generateAdaptedResume,
  adaptedResumeToMarkdown,
} from '@/lib/core/ai/resume-adaptation-generator';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { analyzeAtsWithCache } from '@/lib/core/ai/ats/ats-service';
import { renderResumePdf } from '@/lib/pdf/render-resume-pdf';
import { POST } from '@/app/api/resume/generate/route';

function makeRequest(body: unknown = {}) {
  return { json: async () => body, headers: new Headers() } as any;
}

const SAMPLE_RESUME = {
  fullName: 'Maria Silva',
  headline: '',
  contact: {},
  summary: 'ok',
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
};

describe('Resume Generate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: 'user-1' } }, response: null });
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      remainingPoints: 9,
      msBeforeNext: 0,
    } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeMarkdown: 'Currículo com experiência em desenvolvimento por mais de trinta caracteres.',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue({
      heuristics: { checks: [], score: 80 },
      analysis: { missingKeywords: ['AWS', 'React'] },
      cached: false,
    } as any);
    vi.mocked(renderResumePdf).mockResolvedValue(Buffer.from('%PDF-1.4 test'));
    vi.mocked(adaptedResumeToMarkdown).mockReturnValue('# Maria Silva');
  });

  it('should_return_401_when_unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({
      session: null,
      response: new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 }),
    });
    const res = await POST(makeRequest({ jobTitle: 'Dev' }));
    expect(res.status).toBe(401);
  });

  it('should_return_429_when_rate_limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      msBeforeNext: 30000,
      remainingPoints: 0,
    } as any);
    const res = await POST(makeRequest({ jobTitle: 'Dev' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('should_return_400_when_no_job_title', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Título da vaga');
  });

  it('should_return_400_when_no_resume', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const res = await POST(makeRequest({ jobTitle: 'Dev' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Nenhum currículo');
  });

  it('should_return_resume_pdf_on_success', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(generateAdaptedResume).mockResolvedValue(SAMPLE_RESUME as any);
    const res = await POST(
      makeRequest({ jobTitle: 'Dev', jobDescription: 'Vaga de dev', jobCompany: 'Nubank' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeMarkdown).toBe('# Maria Silva');
    expect(body.pdfBase64).toBeTruthy();
    expect(generateAdaptedResume).toHaveBeenCalledWith(
      expect.stringContaining('Currículo'),
      'Dev',
      'Vaga de dev',
      expect.objectContaining({ jobCompany: 'Nubank', atsKeywords: ['AWS', 'React'] }),
    );
    expect(renderResumePdf).toHaveBeenCalledTimes(1);
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'resume_adaptation', 'cache-key', SAMPLE_RESUME);
  });

  it('should_use_cache_when_hit', async () => {
    vi.mocked(getCached).mockResolvedValue(SAMPLE_RESUME as any);
    const res = await POST(makeRequest({ jobTitle: 'Dev' }));
    expect(res.status).toBe(200);
    expect(generateAdaptedResume).not.toHaveBeenCalled();
    expect(renderResumePdf).toHaveBeenCalledTimes(1);
  });
});