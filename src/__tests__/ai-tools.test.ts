import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/mcp/gupy-client', () => ({
  gupyMcpClient: { searchJobs: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/job-link-filter', () => ({
  jobLinkFilter: { filterAlive: vi.fn() },
}));
vi.mock('@/lib/core/ai/ats/ats-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/ats/ats-service')>()),
  analyzeAtsWithCache: vi.fn(),
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
vi.mock('@/lib/core/ai/cover-letter-generator', () => ({
  generateCoverLetter: vi.fn(),
}));
vi.mock('@/lib/core/ai/resume-adaptation-generator', () => ({
  generateAdaptedResume: vi.fn(),
  adaptedResumeToMarkdown: vi.fn(() => '# Maria Silva'),
}));
vi.mock('@/lib/core/ai/resume-veracity', () => ({
  enforceVeracity: vi.fn((_original: string, resume: unknown) => ({ resume, removed: [] })),
}));
vi.mock('@/lib/core/ai/interview-questions', () => ({
  generateInterviewQuestions: vi.fn(),
}));
vi.mock('@/lib/core/courses/impact-client', () => ({
  searchUdemyCourses: vi.fn(),
}));
vi.mock('@/lib/core/courses/course-provider', () => ({
  buildAffiliateUrl: vi.fn((c: { url: string }) => `${c.url}?ref=aff`),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { jobLinkFilter } from '@/lib/core/pipeline/job-link-filter';
import { analyzeAtsWithCache, buildAtsResumeInput } from '@/lib/core/ai/ats/ats-service';
import { analyzeWithCache } from '@/lib/core/ai/tools/shared';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { generateCoverLetter } from '@/lib/core/ai/cover-letter-generator';
import { generateAdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';
import { enforceVeracity } from '@/lib/core/ai/resume-veracity';
import { generateInterviewQuestions } from '@/lib/core/ai/interview-questions';
import { searchUdemyCourses } from '@/lib/core/courses/impact-client';
import { buildAffiliateUrl } from '@/lib/core/courses/course-provider';
import { createSearchJobsTool } from '@/lib/core/ai/tools/search-jobs';
import { createGetMyProfileTool } from '@/lib/core/ai/tools/get-my-profile';
import { createAnalyzeAtsScoreTool } from '@/lib/core/ai/tools/analyze-ats-score';
import { createAnalyzeJobFitTool } from '@/lib/core/ai/tools/analyze-job-fit';
import { createCompareJobsTool } from '@/lib/core/ai/tools/compare-jobs';
import { createGenerateCoverLetterTool } from '@/lib/core/ai/tools/generate-cover-letter';
import { createGenerateResumeTool } from '@/lib/core/ai/tools/generate-resume';
import { createGetInterviewQuestionsTool } from '@/lib/core/ai/tools/get-interview-questions';
import { createRecommendCoursesTool } from '@/lib/core/ai/tools/recommend-courses';

const PROFILE = {
  resumeMarkdown: 'Currículo com experiência em desenvolvimento por mais de trinta caracteres.',
  resumeText: null,
  skills: ['JavaScript'],
  education: ['Engenharia'],
  experienceYears: 5,
  seniority: 'pleno',
  currentRole: 'Desenvolvedor',
  area: 'Tecnologia',
  profileSource: 'manual',
};

const JOB_ANALYSIS = {
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

const ATS_RESULT = {
  heuristics: { checks: ['contato presente'], score: 80 },
  analysis: {
    score: 80,
    summary: 'bom currículo',
    strengths: ['experiência clara'],
    missingKeywords: ['AWS'],
    formattingIssues: ['sem seções'],
    recommendations: ['adicionar AWS'],
  },
  cached: false,
};

type Tool = {
  inputSchema: { safeParse: (v: unknown) => { success: boolean } };
  execute: (args?: any) => Promise<any>;
};

type ParsableSchema = { safeParse: (v: unknown) => { success: boolean } };

// O tipo do SDK `ai` expõe inputSchema como FlexibleSchema (sem safeParse no tipo);
// o runtime tem safeParse — cast necessário para validar as regras de schema.
function schemaOf(tool: { inputSchema: unknown }): ParsableSchema {
  return tool.inputSchema as ParsableSchema;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
  vi.mocked(analyzeWithCache).mockResolvedValue(JOB_ANALYSIS as any);
  vi.mocked(analyzeAtsWithCache).mockResolvedValue(ATS_RESULT as any);
  vi.mocked(getCached).mockResolvedValue(null);
  vi.mocked(generateCoverLetter).mockResolvedValue({ letter: 'carta', keyPoints: [] });
  vi.mocked(generateInterviewQuestions).mockResolvedValue({ questions: [], category: 'tecnicas' } as any);
  vi.mocked(generateAdaptedResume).mockResolvedValue({ resume: {} } as any);
});

describe('createSearchJobsTool', () => {
  it('should_reject_query_shorter_than_2_chars', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'a' }).success).toBe(false);
  });

  it('should_reject_query_longer_than_200_chars', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'a'.repeat(201) }).success).toBe(false);
  });

  it('should_reject_query_with_disallowed_characters', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Python!' }).success).toBe(false);
    expect(schema.safeParse({ query: 'Data Ánalyst' }).success).toBe(false);
  });

  it('should_accept_query_with_letters_numbers_spaces_hyphen_underscore_dot', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Data-Analyst_2.0' }).success).toBe(true);
  });

  it('should_reject_limit_below_1', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev', limit: 0 }).success).toBe(false);
  });

  it('should_reject_limit_above_20', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev', limit: 21 }).success).toBe(false);
  });

  it('should_default_limit_to_10', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev' }).success).toBe(true);
  });

  it('should_fetch_double_limit_up_to_40_from_gupy', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue([]);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue([]);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    await tool.execute({ query: 'Dev', limit: 20 });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledWith('Dev', 40);

    await tool.execute({ query: 'Dev' });
    expect(gupyMcpClient.searchJobs).toHaveBeenLastCalledWith('Dev', 20);
  });

  it('should_return_error_after_two_searches_on_same_instance_but_work_on_new_instance', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue([]);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue([]);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    await tool.execute({ query: 'Dev' });
    await tool.execute({ query: 'Dev' });
    const third = await tool.execute({ query: 'Dev' });
    expect(third).toEqual({ error: expect.stringContaining('Limite de 2 buscas') });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledTimes(2);

    const fresh = createSearchJobsTool('user-1') as unknown as Tool;
    await fresh.execute({ query: 'Dev' });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledTimes(3);
  });

  it('should_slice_alive_jobs_to_limit_and_apply_format_job_result', async () => {
    const jobs = [
      { title: 'Dev', company: 'A', type: 'remoto', location: 'SP', link: 'https://gupy.io/1', postedAt: '2026-08-01', description: 'descrição curta' },
      { title: 'Dev2', company: 'B', type: 'hibrido', location: 'RJ', link: 'https://gupy.io/2', postedAt: null, description: null },
    ];
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue(jobs as any);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue(jobs as any);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    const result = await tool.execute({ query: 'Dev', limit: 1 });
    expect(result).toHaveLength(1);
    expect(jobLinkFilter.filterAlive).toHaveBeenCalledWith(jobs, { concurrency: 5 });
    expect(result[0]).toEqual({
      titulo: 'Dev',
      empresa: 'A',
      tipo: 'remoto',
      local: 'SP',
      link: 'https://gupy.io/1',
      publicado: '2026-08-01',
      descricao: '<untrusted_content>\ndescrição curta\n</untrusted_content>',
    });
  });
});

describe('createGetMyProfileTool', () => {
  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createGetMyProfileTool('user-1') as unknown as Tool;
    expect(await tool.execute({})).toEqual({ error: expect.stringContaining('Perfil não encontrado') });
  });

  it('should_return_structured_profile_with_resume_truncated_to_3000_chars', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      ...PROFILE,
      resumeMarkdown: 'x'.repeat(5000),
    } as any);
    const tool = createGetMyProfileTool('user-1') as unknown as Tool;
    const result = await tool.execute({});
    expect(result.resumeMarkdown).toHaveLength(3000);
    expect(result.skills).toEqual(['JavaScript']);
    expect(result.experienceYears).toBe(5);
    expect(result.seniority).toBe('pleno');
    expect(result.currentRole).toBe('Desenvolvedor');
    expect(result.area).toBe('Tecnologia');
  });

  it('should_default_education_and_profile_source', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      ...PROFILE,
      education: null,
      profileSource: null,
      resumeMarkdown: null,
    } as any);
    const tool = createGetMyProfileTool('user-1') as unknown as Tool;
    const result = await tool.execute({});
    expect(result.education).toEqual([]);
    expect(result.profileSource).toBe('manual');
    expect(result.resumeMarkdown).toBeNull();
  });
});

describe('createAnalyzeAtsScoreTool', () => {
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

describe('createAnalyzeJobFitTool', () => {
  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createAnalyzeJobFitTool('user-1') as unknown as Tool;
    expect(await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' })).toEqual({
      error: expect.stringContaining('Perfil não encontrado'),
    });
  });

  it('should_analyze_fit_through_analyze_with_cache', async () => {
    const tool = createAnalyzeJobFitTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(analyzeWithCache).toHaveBeenCalledWith('user-1', PROFILE, 'Dev', 'Vaga de dev com dez caracteres');
    expect(result).toEqual(JOB_ANALYSIS);
  });

  it('should_reuse_in_turn_result_for_same_title_and_description', async () => {
    const tool = createAnalyzeJobFitTool('user-1') as unknown as Tool;
    const a = await tool.execute({ jobTitle: '  Dev  ', jobDescription: '  Vaga de dev com dez caracteres  ' });
    const b = await tool.execute({ jobTitle: 'dev', jobDescription: 'vaga de dev com dez caracteres' });
    expect(analyzeWithCache).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('should_reject_job_title_shorter_than_1_char', () => {
    const schema = schemaOf(createAnalyzeJobFitTool('user-1'));
    expect(schema.safeParse({ jobTitle: '', jobDescription: 'Vaga de dev com dez caracteres' }).success).toBe(false);
  });

  it('should_reject_job_description_shorter_than_10_chars', () => {
    const schema = schemaOf(createAnalyzeJobFitTool('user-1'));
    expect(schema.safeParse({ jobTitle: 'Dev', jobDescription: 'curta' }).success).toBe(false);
  });
});

describe('createCompareJobsTool', () => {
  const JOBS = [
    { jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' },
    { jobTitle: 'QA', jobDescription: 'Vaga de QA com dez caracteres' },
  ];

  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    expect(await tool.execute({ jobs: JOBS })).toEqual({
      error: expect.stringContaining('Perfil não encontrado'),
    });
  });

  it('should_rank_jobs_best_fit_first', async () => {
    vi.mocked(analyzeWithCache)
      .mockResolvedValueOnce({ ...JOB_ANALYSIS, overallFit: 'medium' } as any)
      .mockResolvedValueOnce({ ...JOB_ANALYSIS, overallFit: 'high' } as any);
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobs: JOBS });
    expect(result.ranking).toHaveLength(2);
    expect(result.ranking[0].jobTitle).toBe('QA');
    expect(result.ranking[0].overallFit).toBe('high');
    expect(result.ranking[1].overallFit).toBe('medium');
  });

  it('should_reject_less_than_two_jobs', () => {
    const schema = schemaOf(createCompareJobsTool('user-1'));
    expect(schema.safeParse({ jobs: [JOBS[0]] }).success).toBe(false);
  });

  it('should_reject_more_than_five_jobs', () => {
    const schema = schemaOf(createCompareJobsTool('user-1'));
    const five = [...JOBS, ...JOBS, ...JOBS, ...JOBS];
    expect(five).toHaveLength(8);
    expect(schema.safeParse({ jobs: five.slice(0, 6) }).success).toBe(false);
  });

  it('should_include_job_title_in_ranking_entries', async () => {
    const tool = createCompareJobsTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobs: JOBS });
    expect(result.ranking.map((r: { jobTitle: string }) => r.jobTitle)).toEqual(['Dev', 'QA']);
  });
});

describe('createGenerateCoverLetterTool', () => {
  it('should_return_error_when_profile_not_found', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    const tool = createGenerateCoverLetterTool('user-1') as unknown as Tool;
    expect(await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' })).toEqual({
      error: expect.stringContaining('Perfil não encontrado'),
    });
  });

  it('should_return_cached_letter_without_generating', async () => {
    vi.mocked(getCached).mockResolvedValue({ letter: 'carta cacheada', keyPoints: [] });
    const tool = createGenerateCoverLetterTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(result).toEqual({ letter: 'carta cacheada', keyPoints: [] });
    expect(generateCoverLetter).not.toHaveBeenCalled();
  });

  it('should_generate_and_save_letter_on_miss', async () => {
    const tool = createGenerateCoverLetterTool('user-1') as unknown as Tool;
    const result = await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(generateCoverLetter).toHaveBeenCalledWith(
      PROFILE.resumeMarkdown,
      'Dev',
      'Vaga de dev com dez caracteres',
      ['JavaScript'],
      expect.any(String),
    );
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'cover_letter', 'cache-key', { letter: 'carta', keyPoints: [] });
    expect(result).toEqual({ letter: 'carta', keyPoints: [] });
  });

  it('should_reject_invalid_job_title_or_short_description', () => {
    const schema = schemaOf(createGenerateCoverLetterTool('user-1'));
    expect(schema.safeParse({ jobTitle: '', jobDescription: 'Vaga de dev com dez caracteres' }).success).toBe(false);
    expect(schema.safeParse({ jobTitle: 'Dev', jobDescription: 'curta' }).success).toBe(false);
  });
});

describe('createGenerateResumeTool', () => {
  it('should_pass_ats_keywords_into_adaptation_generation', async () => {
    const tool = createGenerateResumeTool('user-1') as unknown as Tool;
    await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(analyzeAtsWithCache).toHaveBeenCalledWith(
      'user-1',
      buildAtsResumeInput(PROFILE),
      { jobDescription: 'Vaga de dev com dez caracteres', traceId: expect.any(String) },
    );
    expect(generateAdaptedResume).toHaveBeenCalledWith(
      PROFILE.resumeMarkdown,
      'Dev',
      'Vaga de dev com dez caracteres',
      { atsKeywords: ['AWS'], traceId: expect.any(String) },
    );
    expect(saveToCache).toHaveBeenCalledWith('user-1', 'resume_adaptation', 'cache-key', expect.any(Object));
  });

  it('should_enforce_veracity_on_cached_resume', async () => {
    const cachedResume = { resume: { summary: 'ok' } };
    vi.mocked(getCached).mockResolvedValue(cachedResume);
    const tool = createGenerateResumeTool('user-1') as unknown as Tool;
    await tool.execute({ jobTitle: 'Dev', jobDescription: 'Vaga de dev com dez caracteres' });
    expect(generateAdaptedResume).not.toHaveBeenCalled();
    expect(enforceVeracity).toHaveBeenCalledWith(PROFILE.resumeMarkdown, cachedResume);
  });

  it('should_allow_empty_job_description', () => {
    const schema = schemaOf(createGenerateResumeTool('user-1'));
    expect(schema.safeParse({ jobTitle: 'Dev' }).success).toBe(true);
  });
});

describe('createGetInterviewQuestionsTool', () => {
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

describe('createRecommendCoursesTool', () => {
  it('should_reject_empty_skills_array', () => {
    const schema = schemaOf(createRecommendCoursesTool('user-1'));
    expect(schema.safeParse({ skills: [] }).success).toBe(false);
  });

  it('should_reject_more_than_six_skills', () => {
    const schema = schemaOf(createRecommendCoursesTool('user-1'));
    expect(schema.safeParse({ skills: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }).success).toBe(false);
  });

  it('should_reject_skill_longer_than_60_chars', () => {
    const schema = schemaOf(createRecommendCoursesTool('user-1'));
    expect(schema.safeParse({ skills: ['a'.repeat(61)] }).success).toBe(false);
  });

  it('should_return_up_to_four_curated_courses_with_affiliate_urls', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([]);
    const tool = createRecommendCoursesTool('user-1') as unknown as Tool;
    const result = await tool.execute({ skills: ['Python'] });
    expect(result.cursos.length).toBeGreaterThan(0);
    expect(result.cursos.length).toBeLessThanOrEqual(4);
    expect(searchUdemyCourses).not.toHaveBeenCalled();
    for (const curso of result.cursos) {
      expect(curso.plataforma).toBe('Udemy');
      expect(buildAffiliateUrl).toHaveBeenCalledWith(expect.objectContaining({ url: curso.url.replace('?ref=aff', '') }));
    }
  });

  it('should_enrich_unmatched_skills_via_impact_api_and_dedupe', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([
      { id: 'impact-udemy-1', title: 'Rust Avançado', skillTags: ['rust'], priceLabel: 'R$ 29,90', url: 'https://trk.udemy.com/rust' } as any,
      { id: 'impact-udemy-2', title: 'Rust Básico', skillTags: ['rust'], priceLabel: 'R$ 19,90', url: 'https://trk.udemy.com/rust2' } as any,
    ]);
    const tool = createRecommendCoursesTool('user-1') as unknown as Tool;
    const result = await tool.execute({ skills: ['Python', 'Rust'] });
    expect(searchUdemyCourses).toHaveBeenCalledWith('Rust', 2);
    const rustCourses = result.cursos.filter((c: { titulo: string }) => c.titulo.startsWith('Rust'));
    expect(rustCourses.length).toBeGreaterThan(0);
    expect(rustCourses[0].url).toBe('https://trk.udemy.com/rust');
  });

  it('should_limit_enrichment_to_two_skills', async () => {
    vi.mocked(searchUdemyCourses).mockResolvedValue([]);
    const tool = createRecommendCoursesTool('user-1') as unknown as Tool;
    await tool.execute({ skills: ['Rust', 'Zig', 'Raku'] });
    expect(searchUdemyCourses).toHaveBeenCalledTimes(2);
  });

  it('should_work_without_profile', async () => {
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    vi.mocked(searchUdemyCourses).mockResolvedValue([]);
    const tool = createRecommendCoursesTool('user-1') as unknown as Tool;
    const result = await tool.execute({ skills: ['Python'] });
    expect(result.cursos.length).toBeGreaterThan(0);
  });
});
