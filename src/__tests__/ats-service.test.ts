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

vi.mock('@/lib/ats/ats-analyzer', () => ({
  analyzeAts: (resume: string, opts?: unknown) => analyzeAtsMock(resume, opts),
  ATS_ANALYZER_PROMPT_VERSION: 'v1',
}));

import { analyzeAtsWithCache } from '@/lib/ats/ats-service';

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
});
