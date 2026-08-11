import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/core/mcp/gupy-client', () => ({
  gupyMcpClient: { searchJobs: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/job-link-filter', () => ({
  jobLinkFilter: { filterAlive: vi.fn() },
}));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/ats/ats-service', () => ({
  analyzeAtsWithCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: vi.fn(() => 'cache-key'),
  getCached: vi.fn(),
  saveToCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/resume-adaptation-generator', () => ({
  generateAdaptedResume: vi.fn(),
  adaptedResumeToMarkdown: vi.fn(() => '# Maria Silva'),
}));
vi.mock('@/lib/core/ai/resume-veracity', () => ({
  enforceVeracity: vi.fn((_original: string, resume: unknown) => ({ resume, removed: { companies: [], roles: [], institutions: [], certifications: [] } })),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { generateAdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';
import { analyzeAtsWithCache } from '@/lib/core/ai/ats/ats-service';
import { createChatTools } from '@/lib/core/ai/chat-tools';

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

describe('createChatTools.generate_resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeMarkdown: 'Currículo com experiência em desenvolvimento por mais de trinta caracteres.',
    } as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue({
      heuristics: { checks: [], score: 80 },
      analysis: { missingKeywords: ['AWS'] },
      cached: false,
    } as any);
  });

  it('should_return_error_when_no_profile', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tools = createChatTools('user-1');
    const result = await (tools.generate_resume as unknown as {
      execute: (args: { jobTitle: string; jobDescription: string }) => Promise<unknown>;
    }).execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev' });
    expect(result).toEqual({ error: expect.stringContaining('Perfil não encontrado') });
  });

  it('should_return_error_when_no_resume', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeMarkdown: null,
      resumeText: null,
    } as any);
    const tools = createChatTools('user-1');
    const result = await (tools.generate_resume as unknown as {
      execute: (args: { jobTitle: string; jobDescription: string }) => Promise<unknown>;
    }).execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev' });
    expect(result).toEqual({ error: expect.stringContaining('Nenhum currículo') });
  });

  it('should_return_cached_resume', async () => {
    vi.mocked(getCached).mockResolvedValue(SAMPLE_RESUME as any);
    const tools = createChatTools('user-1');
    const result = await (tools.generate_resume as unknown as {
      execute: (args: { jobTitle: string; jobDescription: string }) => Promise<unknown>;
    }).execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev' });
    expect(result).toEqual({
      resume: SAMPLE_RESUME,
      resumeMarkdown: '# Maria Silva',
    });
    expect(generateAdaptedResume).not.toHaveBeenCalled();
  });

  it('should_generate_and_save_on_miss', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(generateAdaptedResume).mockResolvedValue(SAMPLE_RESUME as any);
    const tools = createChatTools('user-1');
    const result = await (tools.generate_resume as unknown as {
      execute: (args: { jobTitle: string; jobDescription: string }) => Promise<unknown>;
    }).execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev' });
    expect(generateAdaptedResume).toHaveBeenCalledTimes(1);
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'resume_adaptation', 'cache-key', SAMPLE_RESUME);
    expect(result).toEqual({
      resume: SAMPLE_RESUME,
      resumeMarkdown: '# Maria Silva',
    });
  });
});