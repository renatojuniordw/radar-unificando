import { describe, it, expect } from 'vitest';
import { POPULAR_SKILLS } from '@/lib/core/courses/course-catalog';
import {
  allSkillSlugs,
  skillFromSlug,
  coursesForSlug,
} from '@/lib/core/courses/course-skills';
import { skillSlug } from '@/lib/core/courses/course-matcher';

describe('course-skills (páginas /cursos/[skill])', () => {
  it('deve_resolver_um_slug_para_todos_os_skills_populares', () => {
    for (const skill of POPULAR_SKILLS) {
      const slug = skillSlug(skill);
      expect(allSkillSlugs()).toContain(slug);
      const courses = coursesForSlug(slug);
      expect(courses.length).toBeGreaterThan(0);
      expect(skillFromSlug(slug).length).toBeGreaterThan(0);
    }
  });

  it('deve_resolver_skill_composta_power_bi', () => {
    const courses = coursesForSlug('power-bi');
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.some((c) => c.skillTags.includes('power'))).toBe(true);
    expect(courses.some((c) => c.skillTags.includes('bi'))).toBe(true);
    expect(skillFromSlug('power-bi')).toBe('Power Bi');
  });

  it('deve_retornar_vazio_para_slug_desconhecido', () => {
    expect(coursesForSlug('skill-inexistente')).toEqual([]);
  });

  it('deve_retornar_nome_exato_para_skill_do_catalogo', () => {
    expect(skillFromSlug('kubernetes')).toBe('kubernetes');
  });
});
