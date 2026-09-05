import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/auth-guard', () => ({
  isForeignKeyViolation: vi.fn().mockReturnValue(false),
  STALE_SESSION_ERROR_CODE: 'STALE_SESSION',
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { upsert: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/lib/core/ai/skill-extractor', () => ({
  extractSkillsFromResume: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';
import { isForeignKeyViolation, STALE_SESSION_ERROR_CODE } from '@/lib/api/auth-guard';
import { processUploadJob } from '@/lib/core/upload/upload-processor';
import { computeResumeHash } from '@/lib/core/upload/resume-hash';
import {
  resumeExtractionCache,
  hashContent,
} from '@/lib/core/parsing/resume-extraction-cache';
import { uploadJobStore, type UploadJobResult } from '@/lib/core/upload/upload-job-store';

const FULL_EXTRACTION = {
  skills: ['React', 'TypeScript'],
  experienceYears: 3,
  seniority: 'pleno',
  education: ['Engenharia de Software'],
  currentRole: 'Frontend Developer',
  area: 'Engenharia',
};

function fullResult(overrides: Record<string, unknown> = {}): any {
  return { ...FULL_EXTRACTION, ...overrides };
}

function applyExtraction(result: any): void {
  vi.mocked(extractSkillsFromResume).mockResolvedValue(result);
}

function failWith(error: unknown): void {
  vi.mocked(profileRepository.upsert).mockRejectedValueOnce(error);
}

async function completedJob(jobId: string): Promise<UploadJobResult | undefined> {
  const job = uploadJobStore.findById(jobId);
  return job?.status === 'completed' ? job.result : undefined;
}

async function failedJob(jobId: string): Promise<string | undefined> {
  const job = uploadJobStore.findById(jobId);
  return job?.status === 'failed' ? job.error : undefined;
}

describe('processUploadJob', () => {
  // Conteúdo único por teste: o resumeExtractionCache é singleton global e
  // persiste entre os testes, então cada caso precisa de um hash distinto.
  const contentFor = (label: string) => ({
    markdown: `## Experiencia\n${label} com React e TypeScript.`,
    rawText: `${label} com React e TypeScript.`,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.upsert).mockResolvedValue(undefined);
    vi.mocked(isForeignKeyViolation).mockReturnValue(false);
  });

  it('should_complete_job_and_upsert_profile_with_all_fields', async () => {
    const jobId = 'job-happy';
    const { rawText, markdown } = contentFor('Desenvolvedor');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(fullResult());

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(profileRepository.upsert).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        resumeText: rawText,
        resumeMarkdown: markdown,
        resumeHash: computeResumeHash(rawText, markdown),
        skills: ['React', 'TypeScript'],
        seniority: 'pleno',
        experienceYears: 3,
        currentRole: 'Frontend Developer',
        area: 'Engenharia',
        education: ['Engenharia de Software'],
        profileSource: 'manual',
      }),
    );
    const result = await completedJob(jobId);
    expect(result?.count).toBe(2);
    expect(result?.markdown).toBe(markdown);
    expect(result?.resumeText).toBe(rawText);
  });

  it('should_use_provided_profile_source', async () => {
    const jobId = 'job-source';
    const { rawText, markdown } = contentFor('Analista');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(fullResult());

    await processUploadJob(jobId, 'user-1', { rawText, markdown, profileSource: 'linkedin' });

    expect(profileRepository.upsert).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ profileSource: 'linkedin' }),
    );
  });

  it('should_skip_llm_and_use_cache_when_markdown_already_extracted', async () => {
    const jobId = 'job-cache';
    const { rawText, markdown } = contentFor('Candidato Cache');
    uploadJobStore.create(jobId, 'user-1');
    resumeExtractionCache.set(hashContent(markdown), fullResult());

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(extractSkillsFromResume).not.toHaveBeenCalled();
    expect(profileRepository.upsert).toHaveBeenCalledTimes(1);
    expect((await completedJob(jobId))?.skills).toEqual(['React', 'TypeScript']);
  });

  it('should_fail_job_without_upserting_when_extraction_has_error', async () => {
    const jobId = 'job-extract-error';
    const { rawText, markdown } = contentFor('Candidato Erro');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(
      fullResult({ skills: [], extractionError: 'modelo não respondeu' }),
    );

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(profileRepository.upsert).not.toHaveBeenCalled();
    expect(await failedJob(jobId)).toContain('Não foi possível extrair os dados do currículo');
    expect(await failedJob(jobId)).toContain('modelo não respondeu');
  });

  it('should_upsert_undefined_for_null_optional_fields', async () => {
    const jobId = 'job-nulls';
    const { rawText, markdown } = contentFor('Candidato Nulos');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(
      fullResult({ seniority: null, currentRole: null, area: null, experienceYears: null }),
    );

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    const upsertArgs = vi.mocked(profileRepository.upsert).mock.calls[0][1] as any;
    expect(upsertArgs.seniority).toBeUndefined();
    expect(upsertArgs.currentRole).toBeUndefined();
    expect(upsertArgs.area).toBeUndefined();
    expect(upsertArgs.experienceYears).toBeNull();
    const result = await completedJob(jobId);
    expect(result?.seniority).toBeNull();
    expect(result?.currentRole).toBeNull();
  });

  it('should_fail_job_with_stale_session_code_on_foreign_key_violation', async () => {
    const jobId = 'job-fk';
    const { rawText, markdown } = contentFor('Candidato FK');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(fullResult());
    failWith(new Error('FK violation'));
    vi.mocked(isForeignKeyViolation).mockReturnValue(true);

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(await failedJob(jobId)).toBe(STALE_SESSION_ERROR_CODE);
  });

  it('should_fail_job_with_error_message_when_upsert_throws_error', async () => {
    const jobId = 'job-err';
    const { rawText, markdown } = contentFor('Candidato Erro DB');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(fullResult());
    failWith(new Error('database indisponível'));

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(await failedJob(jobId)).toBe('database indisponível');
  });

  it('should_fail_job_with_default_message_when_upsert_throws_non_error', async () => {
    const jobId = 'job-non-error';
    const { rawText, markdown } = contentFor('Candidato String');
    uploadJobStore.create(jobId, 'user-1');
    applyExtraction(fullResult());
    failWith('upsert string failure');

    await processUploadJob(jobId, 'user-1', { rawText, markdown });

    expect(await failedJob(jobId)).toBe('Falha ao extrair skills via IA');
  });
});