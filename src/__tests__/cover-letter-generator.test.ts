import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateMock = vi.fn();

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: (schema: unknown, prompt: string, opts?: unknown) => generateMock(schema, prompt, opts),
}));
vi.mock('@/lib/core/ai/ai-logger', () => ({
  logAiEvent: vi.fn(),
}));

import { generateCoverLetter } from '@/lib/core/ai/cover-letter-generator';

const RESUME =
  'Maria Silva\nExperiencia\nDesenvolvedora com 5 anos. Aumentei conversao em 30%.\nHabilidades\nReact, TypeScript';

const LETTER = { letter: 'Carta de apresentação', keyPoints: ['Experiência em React'] };

describe('generateCoverLetter', () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue(LETTER);
  });

  it('should_return_validated_letter', async () => {
    const result = await generateCoverLetter(RESUME, 'Desenvolvedora React', 'Vaga de React', ['React']);
    expect(result.letter).toBe('Carta de apresentação');
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('should_include_skills_and_sanitized_content_in_prompt', async () => {
    await generateCoverLetter(RESUME, 'Dev', 'Vaga', ['React', 'TypeScript']);
    const prompt = generateMock.mock.calls[0][1] as string;
    expect(prompt).toContain('SKILLS DO CANDIDATO: React, TypeScript');
    expect(prompt).toContain('<job_title>');
    expect(prompt).toContain('<resume>');
  });

  it('should_throw_without_calling_llm_on_invalid_input', async () => {
    await expect(
      generateCoverLetter('curto', 'Dev', 'Vaga', []),
    ).rejects.toThrow('dados de entrada inválidos');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_throw_generic_error_when_llm_fails', async () => {
    generateMock.mockRejectedValue(new Error('UPSTREAM_SECRET'));
    await expect(
      generateCoverLetter(RESUME, 'Dev', 'Vaga', []),
    ).rejects.toThrow('Não foi possível gerar a carta de apresentação. Tente novamente.');
  });

  it('should_throw_generic_error_on_timeout', async () => {
    generateMock.mockRejectedValue(new Error('LLM_TIMEOUT'));
    await expect(
      generateCoverLetter(RESUME, 'Dev', 'Vaga', []),
    ).rejects.toThrow('Não foi possível gerar a carta de apresentação. Tente novamente.');
  });
});