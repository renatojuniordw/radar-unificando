import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: vi.fn(() => 'cache-key'),
  getCached: vi.fn(),
  saveToCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/job-analyzer', () => ({
  analyzeJobFit: vi.fn(),
}));

import { formatJobResult, analyzeWithCache } from '@/lib/core/ai/tools/shared';
import { isLlmTimeout, withTimeout } from '@/lib/core/ai/shared/with-timeout';
import { analyzeJobFit } from '@/lib/core/ai/job-analyzer';
import { getCached, saveToCache, computeCacheKey } from '@/lib/core/ai/generated-content-cache';
import { JOB_ANALYZER_PROMPT_VERSION } from '@/lib/core/ai/prompts/job-analyzer';

const LONG_DESC = 'a'.repeat(1000);

const ANALYSIS = {
  matchedSkills: ['Python'],
  missingSkills: ['Kubernetes'],
  experienceFit: 'aligned',
  experienceNotes: 'ok',
  seniorityFit: 'aligned',
  educationFit: 'aligned',
  overallFit: 'high',
  summary: 'bom fit',
  recommendations: ['adicionar kubernetes'],
};

const PROFILE = {
  resumeMarkdown: 'resume markdown content',
  resumeText: null,
  skills: ['JavaScript', 'React'],
  education: ['Engenharia'],
  experienceYears: 5,
  seniority: 'senior',
} as any;

describe('formatJobResult', () => {
  it('should_wrap_description_in_untrusted_content_and_truncate_to_800_chars', () => {
    const result = formatJobResult({
      title: 'Dev',
      company: 'ACME',
      type: 'remoto',
      location: 'SP',
      link: 'https://x.io/1',
      postedAt: '2026-08-01',
      description: LONG_DESC,
    });
    expect(result.descricao).toBe(
      `<untrusted_content>\n${'a'.repeat(800)}\n</untrusted_content>`,
    );
  });

  it('should_not_truncate_description_of_exactly_800_chars', () => {
    const desc = 'a'.repeat(800);
    const result = formatJobResult({
      title: 'Dev',
      company: 'ACME',
      type: 'remoto',
      location: 'SP',
      link: 'https://x.io/1',
      description: desc,
    });
    expect(result.descricao).toContain('a'.repeat(800));
  });

  it('should_return_empty_descricao_when_description_is_missing', () => {
    const result = formatJobResult({
      title: 'Dev',
      company: 'ACME',
      type: 'remoto',
      location: 'SP',
      link: 'https://x.io/1',
      description: null,
    });
    expect(result.descricao).toBe('');
  });

  it('should_map_job_fields_and_default_posted_at_to_null', () => {
    const result = formatJobResult({
      title: 'Dev',
      company: 'ACME',
      type: 'remoto',
      location: 'SP',
      link: 'https://x.io/1',
    });
    expect(result).toEqual({
      titulo: 'Dev',
      empresa: 'ACME',
      tipo: 'remoto',
      local: 'SP',
      link: 'https://x.io/1',
      publicado: null,
      descricao: '',
    });
  });
});

describe('analyzeWithCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(analyzeJobFit).mockResolvedValue(ANALYSIS as any);
  });

  it('should_return_cached_analysis_without_calling_analyze_job_fit', async () => {
    vi.mocked(getCached).mockResolvedValue(ANALYSIS as any);
    const result = await analyzeWithCache('user-c', PROFILE, 'Dev', 'Vaga de dev');
    expect(result).toEqual(ANALYSIS);
    expect(analyzeJobFit).not.toHaveBeenCalled();
  });

  it('should_call_analyze_job_fit_and_save_to_cache_on_miss', async () => {
    const result = await analyzeWithCache('user-c', PROFILE, 'Dev', 'Vaga de dev');
    expect(analyzeJobFit).toHaveBeenCalledWith(
      'resume markdown content',
      'Dev',
      'Vaga de dev',
      ['JavaScript', 'React'],
      5,
      'senior',
      ['Engenharia'],
      expect.any(String),
    );
    expect(saveToCache).toHaveBeenCalledWith(
      'user-c',
      'fit_analysis',
      'cache-key',
      ANALYSIS,
    );
    expect(result).toEqual(ANALYSIS);
  });

  it('should_deduplicate_concurrent_calls_with_same_key', async () => {
    const [a, b] = await Promise.all([
      analyzeWithCache('user-d', PROFILE, 'Dev', 'Vaga de dev'),
      analyzeWithCache('user-d', PROFILE, 'Dev', 'Vaga de dev'),
    ]);
    expect(analyzeJobFit).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('should_use_resume_text_when_resume_markdown_is_missing', async () => {
    const profileWithText = { ...PROFILE, resumeMarkdown: null, resumeText: 'texto do currículo' };
    await analyzeWithCache('user-e', profileWithText, 'Dev', 'Vaga de dev');
    expect(analyzeJobFit).toHaveBeenCalledWith(
      'texto do currículo',
      'Dev',
      'Vaga de dev',
      expect.any(Array),
      expect.any(Number),
      expect.any(String),
      expect.any(Array),
      expect.any(String),
    );
  });

  it('should_apply_default_seniority_and_zeroed_experience_for_missing_fields', async () => {
    const sparseProfile = { resumeMarkdown: 'resume', skills: null, education: null, experienceYears: null, seniority: null } as any;
    await analyzeWithCache('user-f', sparseProfile, 'Dev', 'Vaga de dev');
    expect(analyzeJobFit).toHaveBeenCalledWith(
      'resume',
      'Dev',
      'Vaga de dev',
      [],
      0,
      'pleno',
      [],
      expect.any(String),
    );
  });

  it('should_remove_inflight_entry_after_failure_allowing_retry', async () => {
    vi.mocked(analyzeJobFit).mockRejectedValueOnce(new Error('boom'));
    await expect(
      analyzeWithCache('user-g', PROFILE, 'Dev', 'Vaga de dev'),
    ).rejects.toThrow('boom');

    vi.mocked(analyzeJobFit).mockResolvedValueOnce(ANALYSIS as any);
    const result = await analyzeWithCache('user-g', PROFILE, 'Dev', 'Vaga de dev');
    expect(analyzeJobFit).toHaveBeenCalledTimes(2);
    expect(result).toEqual(ANALYSIS);
  });

  it('should_use_computed_cache_key_based_on_job_and_profile_inputs', async () => {
    await analyzeWithCache('user-h', PROFILE, 'Dev', 'Vaga de dev');
    expect(computeCacheKey).toHaveBeenCalledWith(
      JOB_ANALYZER_PROMPT_VERSION,
      ['Dev', 'Vaga de dev', ['JavaScript', 'React'], 5, 'senior', ['Engenharia'], 'resume markdown content'],
    );
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_resolve_with_value_when_run_completes_in_time', async () => {
    const promise = withTimeout(async () => 'ok', 1000);
    await expect(promise).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should_abort_signal_and_reject_with_abort_error_on_timeout', async () => {
    const state: { signal: AbortSignal | null } = { signal: null };
    const promise = withTimeout((signal) => {
      state.signal = signal;
      return new Promise<string>(() => {});
    }, 1000);

    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(state.signal?.aborted).toBe(true);
  });

  it('should_propagate_run_rejection', async () => {
    const promise = withTimeout(async () => {
      throw new Error('UPSTREAM');
    }, 1000);
    await expect(promise).rejects.toThrow('UPSTREAM');
  });

  it('should_clear_timer_after_timeout', async () => {
    const promise = withTimeout(() => new Promise<string>(() => {}), 1000);
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('isLlmTimeout', () => {
  it('should_return_true_for_abort_and_timeout_errors', () => {
    expect(isLlmTimeout(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isLlmTimeout(new DOMException('timeout', 'TimeoutError'))).toBe(true);
    expect(isLlmTimeout(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true);
  });

  it('should_return_false_for_other_errors', () => {
    expect(isLlmTimeout(new Error('LLM_TIMEOUT'))).toBe(false);
    expect(isLlmTimeout(new Error('UPSTREAM'))).toBe(false);
    expect(isLlmTimeout('string')).toBe(false);
    expect(isLlmTimeout(null)).toBe(false);
    expect(isLlmTimeout(undefined)).toBe(false);
  });
});
