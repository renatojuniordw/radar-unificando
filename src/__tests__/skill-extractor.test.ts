import { describe, it, expect, vi } from 'vitest';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';

vi.mock('@/lib/core/ai/llm-provider', () => ({
  generate: vi.fn(),
  LLM_TIMEOUT_MS: 60000,
}));

const { generate } = await import('@/lib/core/ai/llm-provider');

describe('extractSkillsFromResume', () => {
  it('should return skills, experience, seniority and education', async () => {
    vi.mocked(generate).mockResolvedValueOnce({
      skills: ['Python', 'SQL', 'Power BI', 'AWS'],
      experienceYears: 5,
      seniority: 'pleno',
      education: ['Computer Science', 'Statistics'],
    });

    const result = await extractSkillsFromResume('## Skills\nPython, SQL');
    expect(result.skills).toEqual(['Python', 'SQL', 'Power BI', 'AWS']);
    expect(result.experienceYears).toBe(5);
    expect(result.seniority).toBe('pleno');
    expect(result.education).toEqual(['Computer Science', 'Statistics']);
  });

  it('should return null for missing experience and seniority', async () => {
    vi.mocked(generate).mockResolvedValueOnce({
      skills: ['Python'],
      experienceYears: null,
      seniority: null,
      education: [],
    });

    const result = await extractSkillsFromResume('minimal resume');
    expect(result.skills).toEqual(['Python']);
    expect(result.experienceYears).toBeNull();
    expect(result.seniority).toBeNull();
    expect(result.education).toEqual([]);
  });

  it('should throw formatted error when LLM fails', async () => {
    vi.mocked(generate).mockRejectedValueOnce(new Error('LLM timeout'));

    await expect(extractSkillsFromResume('some text')).rejects.toThrow(
      'Não foi possível extrair as skills. Tente novamente.',
    );
  });

  it('should throw when JSON is missing from response', async () => {
    vi.mocked(generate).mockRejectedValueOnce(new Error('JSON não encontrado'));

    await expect(extractSkillsFromResume('some text')).rejects.toThrow(
      'Não foi possível extrair as skills. Tente novamente.',
    );
  });

  it('should handle empty text gracefully', async () => {
    vi.mocked(generate).mockRejectedValueOnce(new Error('Empty input'));

    await expect(extractSkillsFromResume('')).rejects.toThrow(
      'Não foi possível extrair as skills. Tente novamente.',
    );
  });
});
