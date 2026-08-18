import { describe, it, expect } from 'vitest';
import {
  findUnmatchedSkills,
  mergeCourseRecommendations,
} from '@/lib/core/courses/course-recommendation-merge';
import type { Course } from '@/lib/core/courses/course-provider';

function course(id: string, skillTags: string[]): Course {
  return {
    id,
    provider: 'udemy',
    title: `Curso ${id}`,
    description: '',
    skillTags,
    priceLabel: 'R$ 29,90',
    url: `https://udemy.com/${id}`,
  };
}

const CURATED = [
  course('py-1', ['python']),
  course('py-2', ['python']),
  course('py-3', ['python']),
  course('py-4', ['python']),
];

describe('findUnmatchedSkills', () => {
  it('should_return_skills_without_match_in_catalog', () => {
    const unmatched = findUnmatchedSkills(['Python', 'Rust', 'Kubernetes'], CURATED);
    expect(unmatched).toEqual(['Rust', 'Kubernetes']);
  });

  it('should_return_empty_when_all_skills_match', () => {
    expect(findUnmatchedSkills(['Python'], CURATED)).toEqual([]);
  });

  it('should_match_partial_substrings', () => {
    // 'python' cobre 'Python Avançado' e vice-versa (comparação por substring).
    expect(findUnmatchedSkills(['Python Avançado'], CURATED)).toEqual([]);
  });
});

describe('mergeCourseRecommendations', () => {
  it('should_keep_curated_only_when_no_unmatched_skills', () => {
    const merged = mergeCourseRecommendations(CURATED, [], [], 4);
    expect(merged.map((c) => c.id)).toEqual(['py-1', 'py-2', 'py-3', 'py-4']);
  });

  it('should_reserve_slot_for_api_course_of_unmatched_skill', () => {
    const api = [course('impact-rust-1', ['rust'])];
    const merged = mergeCourseRecommendations(CURATED, ['Rust'], [api], 4);
    expect(merged.map((c) => c.id)).toEqual(['py-1', 'py-2', 'py-3', 'impact-rust-1']);
  });

  it('should_include_api_course_even_when_catalog_is_full', () => {
    // Catálogo já preenche 4 — o enriquecimento não pode ser cortado (bug do slice).
    const api = [course('impact-rust-1', ['rust'])];
    const merged = mergeCourseRecommendations(CURATED, ['Rust'], [api], 4);
    expect(merged.some((c) => c.id === 'impact-rust-1')).toBe(true);
    expect(merged.length).toBe(4);
  });

  it('should_prioritize_one_api_course_per_unmatched_skill', () => {
    const api1 = [course('impact-rust-1', ['rust'])];
    const api2 = [course('impact-k8s-1', ['kubernetes'])];
    const merged = mergeCourseRecommendations(CURATED, ['Rust', 'Kubernetes'], [api1, api2], 4);
    expect(merged.map((c) => c.id)).toEqual(['py-1', 'py-2', 'impact-rust-1', 'impact-k8s-1']);
  });

  it('should_dedupe_by_id_between_catalog_and_api', () => {
    // Curso da API com mesmo id de um curado não duplica.
    const api = [course('py-1', ['rust'])];
    const merged = mergeCourseRecommendations(CURATED, ['Rust'], [api], 4);
    expect(merged.filter((c) => c.id === 'py-1')).toHaveLength(1);
  });

  it('should_skip_skills_without_api_results', () => {
    const merged = mergeCourseRecommendations(CURATED, ['Rust', 'Zig'], [[], []], 4);
    expect(merged.map((c) => c.id)).toEqual(['py-1', 'py-2', 'py-3', 'py-4']);
  });

  it('should_fill_with_curated_when_catalog_is_short', () => {
    const api = [course('impact-rust-1', ['rust'])];
    const merged = mergeCourseRecommendations([course('py-1', ['python'])], ['Rust'], [api], 4);
    expect(merged.map((c) => c.id)).toEqual(['py-1', 'impact-rust-1']);
  });

  it('should_respect_limit', () => {
    const api = [course('impact-rust-1', ['rust'])];
    const merged = mergeCourseRecommendations(CURATED, ['Rust'], [api], 2);
    expect(merged.length).toBe(2);
  });
});