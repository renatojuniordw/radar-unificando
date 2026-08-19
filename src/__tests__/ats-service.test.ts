import { describe, it, expect, vi, beforeEach } from 'vitest';

const analyzeAtsMock = vi.fn();
const getCachedMock = vi.fn();
const saveToCacheMock = vi.fn();

vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: (v: string, parts: unknown[]) => `key:${v}:${parts.length}`,
  getCached: (userId: string, kind: string, key: string) => getCachedMock(userId, kind, key),
  saveToCache: (userId: string, kind: string, key: string, content: unknown) =>
    saveToCacheMock(userId, kind, key, content),
}));

vi.mock('@/lib/core/ai/ats/ats-analyzer', () => ({
  analyzeAts: (resume: string, opts?: unknown) => analyzeAtsMock(resume, opts),
}));

import { analyzeAtsWithCache, buildAtsResumeInput } from '@/lib/core/ai/ats/ats-service';

const RESUME = 'Maria Silva\nExperiencia\nAumentei a conversao em 30%.\nHabilidades\nReact, TypeScript';
const ANALYSIS = {
  score: 80,
  summary: 'Bom',
  strengths: ['Contato'],
  missingKeywords: ['AWS'],
  formattingIssues: [],
  recommendations: ['Adicione keywords'],
};

describe('analyzeAtsWithCache', () => {
  beforeEach(() => {
    analyzeAtsMock.mockReset();
    getCachedMock.mockReset();
    saveToCacheMock.mockReset();
  });

  it('should_return_cached_analysis_without_calling_llm', async () => {
    getCachedMock.mockResolvedValue(ANALYSIS);
    const result = await analyzeAtsWithCache('user-1', RESUME);
    expect(result.cached).toBe(true);
    expect(result.analysis.score).toBe(80);
    expect(analyzeAtsMock).not.toHaveBeenCalled();
    expect(saveToCacheMock).not.toHaveBeenCalled();
    expect(result.heuristics.checks.length).toBeGreaterThan(0);
  });

  it('should_call_llm_and_save_when_cache_misses', async () => {
    getCachedMock.mockResolvedValue(null);
    analyzeAtsMock.mockResolvedValue(ANALYSIS);
    const result = await analyzeAtsWithCache('user-1', RESUME, { jobDescription: 'Vaga React' });
    expect(result.cached).toBe(false);
    expect(analyzeAtsMock).toHaveBeenCalledWith(RESUME, { jobDescription: 'Vaga React' });
    expect(saveToCacheMock).toHaveBeenCalledWith('user-1', 'ats_analysis', expect.any(String), ANALYSIS);
  });

  it('should_deduplicate_concurrent_calls_with_same_key', async () => {
    getCachedMock.mockResolvedValue(null);
    analyzeAtsMock.mockResolvedValue(ANALYSIS);
    const [a, b] = await Promise.all([
      analyzeAtsWithCache('user-1', RESUME),
      analyzeAtsWithCache('user-1', RESUME),
    ]);
    expect(analyzeAtsMock).toHaveBeenCalledTimes(1);
    expect(a.analysis).toEqual(b.analysis);
    expect(a.cached).toBe(false);
  });
});

describe('buildAtsResumeInput', () => {
  it('should_combine_resume_with_structured_profile_fields', () => {
    const input = buildAtsResumeInput({
      resumeText: 'Currículo bruto',
      currentRole: 'Dev',
      seniority: 'pleno',
      area: 'Tecnologia',
      experienceYears: 5,
      skills: ['React'],
      education: ['Engenharia'],
    });
    expect(input).toContain('Currículo bruto');
    expect(input).toContain('Cargo atual: Dev');
    expect(input).toContain('Senioridade: pleno');
    expect(input).toContain('Área: Tecnologia');
    expect(input).toContain('Experiência: 5 anos');
    expect(input).toContain('Skills: React');
    expect(input).toContain('Formação: Engenharia');
  });

  it('should_return_base_resume_when_no_structured_fields', () => {
    expect(buildAtsResumeInput({ resumeMarkdown: 'Só o currículo' })).toBe('Só o currículo');
  });

  it('should_skip_null_and_empty_structured_fields', () => {
    const input = buildAtsResumeInput({
      resumeText: 'Base',
      currentRole: null,
      seniority: '',
      area: null,
      experienceYears: 0,
      skills: [],
      education: null,
    });
    expect(input).toBe('Base');
  });

  it('should_ignore_non_array_skills_and_education', () => {
    const input = buildAtsResumeInput({
      resumeText: 'Base',
      skills: 'React',
      education: 'Engenharia',
    });
    expect(input).toBe('Base');
  });

  it('should_prefer_resume_text_over_resume_markdown', () => {
    const input = buildAtsResumeInput({
      resumeText: 'texto',
      resumeMarkdown: 'markdown',
      currentRole: 'Dev',
    });
    expect(input).toContain('texto');
    expect(input).not.toContain('markdown');
  });
});
