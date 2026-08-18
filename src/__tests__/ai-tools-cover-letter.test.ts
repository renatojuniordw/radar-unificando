import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/ai/generated-content-cache', () => ({
  computeCacheKey: vi.fn(() => 'cache-key'),
  getCached: vi.fn(),
  saveToCache: vi.fn(),
}));
vi.mock('@/lib/core/ai/cover-letter-generator', () => ({
  generateCoverLetter: vi.fn(),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { generateCoverLetter } from '@/lib/core/ai/cover-letter-generator';
import { createGenerateCoverLetterTool } from '@/lib/core/ai/tools/generate-cover-letter';
import { PROFILE, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createGenerateCoverLetterTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(generateCoverLetter).mockResolvedValue({ letter: 'carta', keyPoints: [] });
  });

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