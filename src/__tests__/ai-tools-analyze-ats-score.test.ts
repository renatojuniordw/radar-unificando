import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/ats/ats-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/ats/ats-service')>()),
  analyzeAtsWithCache: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeAtsWithCache, buildAtsResumeInput } from '@/lib/core/ai/ats/ats-service';
import { createAnalyzeAtsScoreTool } from '@/lib/core/ai/tools/analyze-ats-score';
import { PROFILE, ATS_RESULT, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createAnalyzeAtsScoreTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(analyzeAtsWithCache).mockResolvedValue(ATS_RESULT as any);
  });

  it('should_return_error_when_profile_has_no_resume', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeMarkdown: null,
      resumeText: null,
    } as any);
    const tool = createAnalyzeAtsScoreTool('user-1') as unknown as Tool;
    expect(await tool.execute({})).toEqual({ error: expect.stringContaining('Nenhum currículo') });
  });

  it('should_return_error_when_resume_is_shorter_than_30_chars', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      resumeMarkdown: 'curto',
    } as any);
    const tool = createAnalyzeAtsScoreTool('user-1') as unknown as Tool;
    expect(await tool.execute({})).toEqual({ error: expect.stringContaining('Nenhum currículo') });
  });

  it('should_run_ats_analysis_and_return_expected_shape_on_success', async () => {
    const tool = createAnalyzeAtsScoreTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobDescription: 'Vaga de dados' });
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      buildAtsResumeInput(PROFILE),
      { jobDescription: 'Vaga de dados', traceId: expect.any(String) },
    );
    expect(result).toEqual({
      score: 80,
      summary: 'bom currículo',
      strengths: ['experiência clara'],
      missingKeywords: ['AWS'],
      formattingIssues: ['sem seções'],
      recommendations: ['adicionar AWS'],
      heuristicChecks: ['contato presente'],
    });
  });

  it('should_reject_job_description_longer_than_8000_chars', () => {
    const schema = schemaOf(createAnalyzeAtsScoreTool('user-1'));
    expect(schema.safeParse({ jobDescription: 'a'.repeat(8001) }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(true);
  });
});