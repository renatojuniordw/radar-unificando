import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateMock = vi.fn();

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: (schema: unknown, prompt: string) => generateMock(schema, prompt),
}));

import { analyzeAts } from '@/lib/core/ai/ats/ats-analyzer';

const RESUME = 'Maria Silva\nExperiencia\nDesenvolvedora com 5 anos. Aumentei conversao em 30%.\nHabilidades\nReact, TypeScript';

describe('analyzeAts', () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue({
      score: 72,
      summary: 'Currículo bom, faltam keywords.',
      strengths: ['Contato presente', 'Métricas claras'],
      missingKeywords: ['GraphQL', 'AWS'],
      formattingIssues: ['Sem seção de idiomas'],
      recommendations: ['Adicione palavras-chave da vaga'],
    });
  });

  it('should_return_validated_analysis', async () => {
    const result = await analyzeAts(RESUME);
    expect(result.score).toBe(72);
    expect(result.missingKeywords).toContain('AWS');
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('should_include_job_description_in_prompt_when_provided', async () => {
    await analyzeAts(RESUME, { jobDescription: 'Vaga de desenvolvedor React' });
    const prompt = generateMock.mock.calls[0][1] as { system: string; user: string };
    expect(prompt.user).toContain('<job_description>');
    expect(prompt.user).toContain('Vaga de desenvolvedor React');
  });

  it('should_throw_on_short_resume', async () => {
    await expect(analyzeAts('curto')).rejects.toThrow('Currículo muito curto');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_reject_oversized_job_description', async () => {
    const huge = 'x'.repeat(9000);
    await expect(analyzeAts(RESUME, { jobDescription: huge })).rejects.toThrow('Descrição muito longa');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_retry_once_on_timeout_and_succeed', async () => {
    generateMock
      .mockRejectedValueOnce(Object.assign(new Error('LLM_TIMEOUT'), { name: 'AbortError' }))
      .mockResolvedValueOnce({
        score: 72,
        summary: 'Bom',
        strengths: [],
        missingKeywords: [],
        formattingIssues: [],
        recommendations: [],
      });
    const result = await analyzeAts(RESUME);
    expect(result.score).toBe(72);
    expect(generateMock).toHaveBeenCalledTimes(2);
  });

  it('should_throw_timeout_error_after_two_timeouts', async () => {
    generateMock.mockRejectedValue(Object.assign(new Error('LLM_TIMEOUT'), { name: 'AbortError' }));
    await expect(analyzeAts(RESUME)).rejects.toThrow(
      'A análise ATS demorou mais que o esperado. Tente novamente em instantes.',
    );
    expect(generateMock).toHaveBeenCalledTimes(2);
  });

  it('should_throw_generic_error_without_leaking_llm_message', async () => {
    generateMock.mockRejectedValue(new Error('UPSTREAM_SECRET_ENDPOINT'));
    await expect(analyzeAts(RESUME)).rejects.toThrow(
      'Não foi possível analisar o currículo. Tente novamente.',
    );
    await expect(analyzeAts(RESUME)).rejects.not.toThrow('UPSTREAM_SECRET_ENDPOINT');
  });

  it('should_deduplicate_missing_keywords_and_skill_scores', async () => {
    generateMock.mockResolvedValue({
      score: 70,
      summary: 'resumo',
      missingKeywords: ['AWS', 'AWS', ''],
      strengths: [],
      formattingIssues: [],
      recommendations: [],
      skillScores: [{ skill: 'Python' }, { skill: 'Python' }, { skill: '' }],
    });
    const result = await analyzeAts(RESUME);
    expect(result.missingKeywords).toEqual(['AWS']);
    expect(result.skillScores).toEqual([{ skill: 'Python' }]);
  });
});
