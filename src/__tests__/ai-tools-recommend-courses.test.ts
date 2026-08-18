import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));
vi.mock('@/lib/core/courses/impact-client', () => ({
  searchUdemyCourses: vi.fn(),
}));
vi.mock('@/lib/core/courses/course-provider', () => ({
  buildAffiliateUrl: vi.fn((c: { url: string }) => `${c.url}?ref=aff`),
}));

import { profileRepository } from '@/lib/infrastructure/repositories';
import { searchUdemyCourses } from '@/lib/core/courses/impact-client';
import { buildAffiliateUrl } from '@/lib/core/courses/course-provider';
import { createRecommendCoursesTool } from '@/lib/core/ai/tools/recommend-courses';
import { PROFILE, schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createRecommendCoursesTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue(PROFILE as any);
  });

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