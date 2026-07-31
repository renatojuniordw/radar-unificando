import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
  jobRepository: { findById: vi.fn() },
}));
vi.mock('@/lib/core/ai/resume-adapt', () => ({
  adaptResumeForJob: vi.fn(),
}));

import { auth } from '@/auth';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { adaptResumeForJob } from '@/lib/core/ai/resume-adapt';
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
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({ skills: ['python'], resumeText: 'resume' } as any);
    vi.mocked(jobRepository.findById).mockResolvedValue(null);
    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    expect(res.status).toBe(404);
  });

  it('should_return_adapted_resume_on_success', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeText: 'Resume text here',
      skills: ['python', 'sql'],
      experienceYears: 3,
      seniority: 'pleno',
      parsedData: { education: ['Computer Science'] },
    } as any);
    vi.mocked(jobRepository.findById).mockResolvedValue({
      id: '1', tituloVaga: 'Data Analyst', descricao: 'python sql', empresa: 'CorpA', tipo: 'Remoto', local: '',
    } as any);
    vi.mocked(adaptResumeForJob).mockResolvedValue({
      resume: '# Adapted Resume\n\nExperience with Python...',
      highlights: ['Python expertise', 'SQL knowledge'],
      missingSkills: ['AWS'],
    });

    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    const body = await res.json();
    expect(body.adaptedResume).toBe('# Adapted Resume\n\nExperience with Python...');
    expect(body.highlights).toEqual(['Python expertise', 'SQL knowledge']);
    expect(body.missingSkills).toEqual(['AWS']);
    expect(body.empresa).toBe('CorpA');
  });

  it('should_return_500_on_llm_failure', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({ resumeText: 'resume', skills: [] } as any);
    vi.mocked(jobRepository.findById).mockResolvedValue({ tituloVaga: 'Job', descricao: '' } as any);
    vi.mocked(adaptResumeForJob).mockRejectedValue(new Error('Não foi possível adaptar o currículo. Tente novamente.'));

    const res = await POST({ json: async () => ({ jobId: '1' }) } as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('Tente novamente');
  });
});
