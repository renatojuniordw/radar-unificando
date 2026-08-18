import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateMock = vi.fn();

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: (schema: unknown, prompt: string) => generateMock(schema, prompt),
}));

import {
  generateAdaptedResume,
  adaptedResumeToMarkdown,
} from '@/lib/core/ai/resume-adaptation-generator';

const RESUME =
  'Maria Silva\nExperiencia\nDesenvolvedora com 5 anos. Aumentei conversao em 30%.\nHabilidades\nReact, TypeScript';

const SAMPLE_RESUME = {
  fullName: 'Maria Silva',
  headline: 'Desenvolvedora | React | TypeScript',
  contact: { email: 'maria@email.com', phone: '', location: 'São Paulo', linkedin: '' },
  summary: 'Desenvolvedora com 5 anos de experiência.',
  skills: ['React', 'TypeScript'],
  experience: [
    { role: 'Desenvolvedora', company: 'Empresa X', period: '2021-2024', bullets: ['Aumentei conversão em 30%'] },
  ],
  education: [{ degree: 'Ciência da Computação', institution: 'USP', period: '2015-2019' }],
  certifications: [],
  languages: [{ language: 'Inglês', level: 'Avançado' }],
};

describe('generateAdaptedResume', () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue(SAMPLE_RESUME);
  });

  it('should_return_validated_resume', async () => {
    const result = await generateAdaptedResume(RESUME, 'Desenvolvedora React', 'Vaga de React');
    expect(result.fullName).toBe('Maria Silva');
    expect(result.skills).toContain('React');
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('should_include_job_tags_in_prompt', async () => {
    await generateAdaptedResume(RESUME, 'Desenvolvedora React', 'Vaga de React', {
      jobCompany: 'Nubank',
      jobLocation: 'SP',
      atsKeywords: ['React', 'TypeScript'],
    });
    const prompt = generateMock.mock.calls[0][1] as string;
    expect(prompt).toContain('<job_title>');
    expect(prompt).toContain('<job_description>');
    expect(prompt).toContain('<job_company>');
    expect(prompt).toContain('<job_location>');
    expect(prompt).toContain('<ats_keywords>');
    expect(prompt).toContain('React, TypeScript');
    expect(prompt).toContain('<resume>');
  });

  it('should_omit_ats_keywords_block_when_empty', async () => {
    await generateAdaptedResume(RESUME, 'Dev', 'Vaga');
    const prompt = generateMock.mock.calls[0][1] as string;
    // O bloco de dados <ats_keywords>...</ats_keywords> não deve ser adicionado
    // quando não há keywords (a tag só aparece nas regras do prompt base).
    expect(prompt).not.toMatch(/<ats_keywords>\s*\n\s*<\/ats_keywords>/);
  });

  it('should_throw_on_short_resume', async () => {
    await expect(generateAdaptedResume('curto', 'Dev', '')).rejects.toThrow('Currículo muito curto');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('should_reject_oversized_job_description', async () => {
    const huge = 'x'.repeat(9000);
    await expect(generateAdaptedResume(RESUME, 'Dev', huge)).rejects.toThrow(
      'Descrição muito longa',
    );
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('adaptedResumeToMarkdown_should_build_markdown', () => {
    const md = adaptedResumeToMarkdown(SAMPLE_RESUME);
    expect(md).toContain('# Maria Silva');
    expect(md).toContain('## Habilidades');
    expect(md).toContain('## Experiência');
    expect(md).toContain('## Formação');
    expect(md).toContain('## Idiomas');
  });

  it('should_throw_generic_error_when_llm_fails', async () => {
    generateMock.mockRejectedValue(new Error('UPSTREAM_SECRET_ENDPOINT'));
    await expect(
      generateAdaptedResume(RESUME, 'Dev', 'Vaga de dev', {}),
    ).rejects.toThrow('Não foi possível gerar o currículo adaptado. Tente novamente.');
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('should_retry_once_and_succeed_after_llm_timeout', async () => {
    generateMock
      .mockRejectedValueOnce(Object.assign(new Error('LLM_TIMEOUT'), { name: 'AbortError' }))
      .mockResolvedValueOnce(SAMPLE_RESUME);

    const result = await generateAdaptedResume(RESUME, 'Dev', 'Vaga de dev');
    expect(result.fullName).toBe('Maria Silva');
    expect(generateMock).toHaveBeenCalledTimes(2);
  });

  it('should_throw_timeout_message_when_both_attempts_time_out', async () => {
    generateMock.mockRejectedValue(Object.assign(new Error('LLM_TIMEOUT'), { name: 'AbortError' }));
    await expect(
      generateAdaptedResume(RESUME, 'Dev', 'Vaga de dev'),
    ).rejects.toThrow('A geração do currículo demorou mais que o esperado. Tente novamente em instantes.');
    expect(generateMock).toHaveBeenCalledTimes(2);
  });
});