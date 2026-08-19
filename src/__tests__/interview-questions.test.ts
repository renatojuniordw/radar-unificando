import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateMock = vi.fn();

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: (schema: unknown, prompt: string, opts?: unknown) => generateMock(schema, prompt, opts),
}));
vi.mock('@/lib/core/ai/ai-logger', () => ({
  logAiEvent: vi.fn(),
}));

import { generateInterviewQuestions } from '@/lib/core/ai/interview-questions';

const RESUME =
  'Maria Silva\nExperiencia\nDesenvolvedora com 5 anos. Aumentei conversao em 30%.\nHabilidades\nReact, TypeScript';

const QUESTIONS = {
  questions: [
    { question: 'Conte sobre um projeto com React', category: 'technical', rationale: 'Avalia profundidade em React' },
    { question: 'Como você lida com prazos apertados?', category: 'behavioral', rationale: 'Avalia soft skill' },
  ],
};

describe('generateInterviewQuestions', () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue(QUESTIONS);
  });

  it('should_return_validated_questions', async () => {
    const result = await generateInterviewQuestions(RESUME, 'Desenvolvedora React', 'Vaga de React', ['React'], ['GraphQL']);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].category).toBe('technical');
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('should_include_matched_and_missing_skills_in_prompt', async () => {
    await generateInterviewQuestions(RESUME, 'Dev', 'Vaga', ['React', 'TypeScript'], ['GraphQL', 'AWS']);
    const prompt = generateMock.mock.calls[0][1] as { system: string; user: string };
    expect(prompt.user).toContain('MATCHED_SKILLS: React, TypeScript');
    expect(prompt.user).toContain('MISSING_SKILLS: GraphQL, AWS');
  });

  it('should_use_fallback_label_when_skills_are_empty', async () => {
    await generateInterviewQuestions(RESUME, 'Dev', 'Vaga', [], []);
    const prompt = generateMock.mock.calls[0][1] as { system: string; user: string };
    expect(prompt.user).toContain('MATCHED_SKILLS: nenhuma identificada');
    expect(prompt.user).toContain('MISSING_SKILLS: nenhuma identificada');
  });

  it('should_throw_on_short_resume', async () => {
    await expect(
      generateInterviewQuestions('curto', 'Dev', 'Vaga', [], []),
    ).rejects.toThrow('dados de entrada inválidos');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_reject_oversized_job_description', async () => {
    const huge = 'x'.repeat(9000);
    await expect(
      generateInterviewQuestions(RESUME, 'Dev', huge, [], []),
    ).rejects.toThrow('dados de entrada inválidos');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_throw_generic_error_on_llm_failure', async () => {
    generateMock.mockRejectedValue(new Error('LLM_API_SECRET'));
    await expect(
      generateInterviewQuestions(RESUME, 'Dev', 'Vaga', [], []),
    ).rejects.toThrow('Não foi possível gerar as perguntas de entrevista. Tente novamente.');
  });
});