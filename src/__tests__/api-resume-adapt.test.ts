import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
  jobRepository: { findById: vi.fn() },
}));
vi.mock('@/lib/core/matching/scoring-engine', () => ({
  scoringEngine: { calculate: vi.fn() },
}));
vi.mock('@/lib/core/matching/resume-adapter', () => ({
  resumeAdapter: { adapt: vi.fn().mockReturnValue('Adapted resume text') },
}));
vi.mock('@/lib/core/matching/skill-taxonomy', () => ({
  findMatchingSkills: vi.fn().mockReturnValue(['python', 'sql']),
}));

import { auth } from '@/auth';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { scoringEngine } from '@/lib/core/matching/scoring-engine';
import { POST } from '@/app/api/resume/adapt/route';

describe('POST /api/resume/adapt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_401_when_not_authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    expect(res.status).toBe(401);
  });

  it('should_return_400_when_job_id_missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(400);
  });

  it('should_return_404_when_profile_not_found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    expect(res.status).toBe(404);
  });

  it('should_return_404_when_job_not_found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({ skills: ['python'] } as any);
    vi.mocked(jobRepository.findById).mockResolvedValue(null);
    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    expect(res.status).toBe(404);
  });

  it('should_return_adapted_resume_on_success', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({ skills: ['python'], experienceYears: 3, seniority: 'pleno' } as any);
    vi.mocked(jobRepository.findById).mockResolvedValue({ id: '1', tituloVaga: 'Data Analyst', descricao: 'python', empresa: 'CorpA', tipo: 'Remoto', local: '' } as any);
    vi.mocked(scoringEngine.calculate).mockReturnValue({ totalScore: 0.9, breakdown: {} as any, matchedSkills: ['python'], missingMandatory: [], evidence: [] } as any);
    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    const body = await res.json();
    expect(body.adaptedResume).toBe('Adapted resume text');
    expect(body.score).toBe(90);
  });
});
