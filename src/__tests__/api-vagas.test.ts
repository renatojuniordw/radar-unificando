import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: { findByUserId: vi.fn(), findRecommendedByUserId: vi.fn() },
  profileRepository: { findByUserId: vi.fn() },
}));

import { auth } from '@/auth';
import { jobRepository, profileRepository } from '@/lib/infrastructure/repositories';
import { GET } from '@/app/api/vagas/route';

function makeRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/vagas');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString(), nextUrl: url } as any;
}

describe('GET /api/vagas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_mapped_jobs', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([
      { id: '1', company: 'CorpA', platform: 'Gupy', title: 'Analyst', roleCategory: 'Analytics', type: 'Remoto', location: 'Remote', link: 'https://a.com', companyNameOnPlatform: 'corp', postedAt: '', onList: 'Sim', alert: '', detectedAt: null } as any,
    ]);
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].company).toBe('CorpA');
    expect(body[0].roleCategory).toBe('Analytics');
  });

  it('should_pass_filters_to_repository', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    await GET(makeRequest({ platform: 'Gupy', role: 'Analytics', search: 'test' }));
    expect(jobRepository.findByUserId).toHaveBeenCalledWith('user-1', {
      platform: 'Gupy',
      role: 'Analytics',
      search: 'test',
    });
  });

  it('should_return_anonymous_user_id_when_not_authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    await GET(makeRequest());
    expect(jobRepository.findByUserId).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000', expect.any(Object));
  });

  it('should_return_500_on_error', async () => {
    vi.mocked(jobRepository.findByUserId).mockRejectedValue(new Error('DB error'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  describe('recommended=1', () => {
    it('should_return_empty_when_not_authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const res = await GET(makeRequest({ recommended: '1' }));
      const body = await res.json();
      expect(body).toEqual([]);
      expect(profileRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should_return_empty_when_profile_not_found', async () => {
      vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
      const res = await GET(makeRequest({ recommended: '1' }));
      const body = await res.json();
      expect(body).toEqual([]);
      expect(jobRepository.findRecommendedByUserId).not.toHaveBeenCalled();
    });

    it('should_return_ranked_jobs_from_profile', async () => {
      vi.mocked(profileRepository.findByUserId).mockResolvedValue({
        currentRole: 'Analista de Dados',
        area: 'Dados',
        skills: ['Python', 'SQL'],
      } as any);
      vi.mocked(jobRepository.findRecommendedByUserId).mockResolvedValue([
        {
          job: { id: '1', company: 'CorpA', platform: 'Gupy', title: 'Analista de Dados', roleCategory: 'Dados', type: 'Remoto', location: 'Remote', link: 'https://a.com', companyNameOnPlatform: 'corp', postedAt: '', onList: 'Sim', alert: '', detectedAt: null },
          score: 5,
        } as any,
      ]);

      const res = await GET(makeRequest({ recommended: '1' }));
      const body = await res.json();

      expect(jobRepository.findRecommendedByUserId).toHaveBeenCalledWith('user-1', {
        currentRole: 'Analista de Dados',
        area: 'Dados',
        skills: ['Python', 'SQL'],
      });
      expect(body).toHaveLength(1);
      expect(body[0].company).toBe('CorpA');
      expect(body[0]._score).toBe(5);
    });
  });
});
