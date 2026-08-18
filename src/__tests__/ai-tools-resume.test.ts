import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/ats/ats-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/ats/ats-service')>()),
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
  enforceVeracity: vi.fn((_original: string, resume: unknown) => ({ resume, removed: [] })),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache, buildAtsResumeInput } from '@/lib/core/ai/ats/ats-service';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { generateAdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';
import { enforceVeracity } from '@/lib/core/ai/resume-veracity';
import { createGenerateResumeTool } from '@/lib/core/ai/tools/generate-resume';
import { PROFILE, ATS_RESULT, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createGenerateResumeTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue(ATS_RESULT as any);
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(generateAdaptedResume).mockResolvedValue({ resume: {} } as any);
  });

  it('should_pass_ats_keywords_into_adaptation_generation', async () => {
    const tool = createGenerateResumeTool('user-1') as unknown as Tool;
    await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      buildAtsResumeInput(PROFILE),
      { jobDescription: 'Vaga de dev com dez caracteres', traceId: expect.any(String) },
    );
    expect(generateAdaptedResume).toHaveBeenCalledWith(
      PROFILE.resumeMarkdown,
      'Dev',
      'Vaga de dev com dez caracteres',
      { atsKeywords: ['AWS'], traceId: expect.any(String) },
    );
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'resume_adaptation', 'cache-key', expect.any(Object));
  });

  it('should_enforce_veracity_on_cached_resume', async () => {
    const cachedResume = { resume: { summary: 'ok' } };
    vi.mocked(getCached).mockResolvedValue(cachedResume);
    const tool = createGenerateResumeTool('user-1') as unknown as Tool;
    await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(generateAdaptedResume).not.toHaveBeenCalled();
    expect(enforceVeracity).toHaveBeenCalledWith(PROFILE.resumeMarkdown, cachedResume);
  });

  it('should_allow_empty_job_description', () => {
    const schema = schemaOf(createGenerateResumeTool('user-1'));
    expect(schema.safeParse({ jobTitle: 'Dev' }).success).toBe(true);
  });
});