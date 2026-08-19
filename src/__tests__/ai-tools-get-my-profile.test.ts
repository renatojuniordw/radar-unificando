import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { createGetMyProfileTool } from '@/lib/core/ai/tools/get-my-profile';
import { PROFILE, type Tool } from './helpers/ai-tool-fixtures';

describe('createGetMyProfileTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
  });

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