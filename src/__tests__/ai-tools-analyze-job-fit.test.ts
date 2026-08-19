import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/tools/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/core/ai/tools/shared')>()),
  analyzeWithCache: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeWithCache } from '@/lib/core/ai/tools/shared';
import { createAnalyzeJobFitTool } from '@/lib/core/ai/tools/analyze-job-fit';
import { PROFILE, JOB_ANALYSIS, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createAnalyzeJobFitTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(analyzeWithCache).mockResolvedValue(JOB_ANALYSIS as any);
  });

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