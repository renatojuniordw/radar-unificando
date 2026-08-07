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
vi.mock('@/lib/ats/ats-rewriter', () => ({
  rewriteResumeSection: vi.fn(),
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { rewriteResumeSection } from '@/lib/ats/ats-rewriter';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from '@/app/api/extension/rewrite/route';

function makeRequest(auth?: string, body: unknown = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  return { json: async () => body, headers } as any;
}

describe('Extension Rewrite API', () => {
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

  it('should_return_400_when_section_too_short', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);

    const res = await POST(makeRequest('Bearer valid-token', { section: 'ab', jobDescription: 'Vaga' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('muito curto');
  });

  it('should_return_400_when_no_resume', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);

    const res = await POST(
      makeRequest('Bearer valid-token', { section: 'Trecho do currículo para reescrever', jobDescription: 'Vaga' })
    );
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

    const res = await POST(makeRequest('Bearer valid-token', { section: 'Trecho', jobDescription: 'Vaga' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('should_return_rewritten_section_on_success', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Currículo com experiência em desenvolvimento de software por mais de trinta caracteres.',
    } as any);
    vi.mocked(rewriteResumeSection).mockResolvedValue({
      rewritten: 'Trecho reescrito com keywords da vaga e métricas.',
      changes: ['Adicionei keyword Java'],
    } as any);

    const res = await POST(
      makeRequest('Bearer valid-token', { section: 'Desenvolvedor com 5 anos.', jobDescription: 'Vaga Java' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rewritten).toContain('keywords');
    expect(rewriteResumeSection).toHaveBeenCalledWith(
      expect.stringContaining('Currículo'),
      'Desenvolvedor com 5 anos.',
      expect.objectContaining({ jobDescription: 'Vaga Java' })
    );
  });
});