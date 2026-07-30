import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
  jobRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/matching/scoring-engine', () => ({
  scoringEngine: { calculate: vi.fn() },
}));
vi.mock('@/lib/core/matching/skill-taxonomy', () => ({
  findMatchingSkills: vi.fn().mockReturnValue(['python', 'sql']),
}));

import { auth } from '@/auth';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { scoringEngine } from '@/lib/core/matching/scoring-engine';
import { GET } from '@/app/api/match/route';

describe('GET /api/match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_401_when_not_authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it('should_return_404_when_profile_not_found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('should_return_sorted_match_results', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({ skills: ['python'], experienceYears: 3, seniority: 'pleno' } as any);
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([
      { id: '1', empresa: 'CorpA', tituloVaga: 'Data Analyst', cargoCategoria: 'Analytics', plataforma: 'Gupy', link: 'https://a.com', descricao: 'python sql', tipo: 'Remoto', local: '' } as any,
      { id: '2', empresa: 'CorpB', tituloVaga: 'BI Analyst', cargoCategoria: 'BI', plataforma: 'InHire', link: 'https://b.com', descricao: 'power bi', tipo: 'Presencial', local: 'SP' } as any,
    ]);
    vi.mocked(scoringEngine.calculate).mockReturnValueOnce({
      totalScore: 0.8, breakdown: {} as any, matchedSkills: ['python'], missingMandatory: [], evidence: ['Score: 80%'],
    } as any);
    vi.mocked(scoringEngine.calculate).mockReturnValueOnce({
      totalScore: 0.4, breakdown: {} as any, matchedSkills: [], missingMandatory: ['power bi'], evidence: ['Score: 40%'],
    } as any);
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].score).toBeGreaterThanOrEqual(body[1].score);
  });
});
