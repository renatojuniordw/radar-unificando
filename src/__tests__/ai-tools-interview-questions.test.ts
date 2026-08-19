import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/tools/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/tools/shared')>()),
  analyzeWithCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: vi.fn(() => 'cache-key'),
  getCached: vi.fn(),
  saveToCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/interview-questions', () => ({
  generateInterviewQuestions: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeWithCache } from '@/lib/core/ai/tools/shared';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { generateInterviewQuestions } from '@/lib/core/ai/interview-questions';
import { createGetInterviewQuestionsTool } from '@/lib/core/ai/tools/get-interview-questions';
import { PROFILE, JOB_ANALYSIS, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createGetInterviewQuestionsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(analyzeWithCache).mockResolvedValue(JOB_ANALYSIS as any);
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(generateInterviewQuestions).mockResolvedValue({ questions: [], category: 'tecnicas' } as any);
  });

  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createGetInterviewQuestionsTool('user-1') as unknown as Tool;
    expect(await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' })).toEqual({
      error: expect.stringContaining('Perfil não encontrado'),
    });
  });

  it('should_return_cached_questions_without_llm_calls', async () => {
    const questions = { questions: ['q1'], category: 'tecnicas' };
    vi.mocked(getCached).mockResolvedValue(questions as any);
    const tool = createGetInterviewQuestionsTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(result).toEqual(questions);
    expect(analyzeWithCache).not.toHaveBeenCalled();
    expect(generateInterviewQuestions).not.toHaveBeenCalled();
  });

  it('should_generate_and_save_questions_on_miss_using_fit_skills', async () => {
    vi.mocked(analyzeWithCache).mockResolvedValue({
      ...JOB_ANALYSIS,
      matchedSkills: ['Python'],
      missingSkills: ['Kubernetes'],
    } as any);
    const tool = createGetInterviewQuestionsTool('user-1') as unknown as Tool;
    await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(analyzeWithCache).toHaveBeenCalledWith('user-1', PROFILE, 'Dev', 'Vaga de dev com dez caracteres');
    expect(generateInterviewQuestions).toHaveBeenCalledWith(
      PROFILE.resumeMarkdown,
      'Dev',
      'Vaga de dev com dez caracteres',
      ['Python'],
      ['Kubernetes'],
      expect.any(String),
    );
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'interview_questions', 'cache-key', expect.any(Object));
  });

  it('should_reject_invalid_input', () => {
    const schema = schemaOf(createGetInterviewQuestionsTool('user-1'));
    expect(schema.safeParse({ jobTitle: '', jobDescription: 'Vaga de dev com dez caracteres' }).success).toBe(false);
    expect(schema.safeParse({ jobTitle: 'Dev', jobDescription: 'curta' }).success).toBe(false);
  });
});