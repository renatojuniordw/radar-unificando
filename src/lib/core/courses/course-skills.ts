// Helpers de skill para as páginas estáticas /cursos/[skill] (SEO).
// Módulo puro e testável.

import { COURSES, POPULAR_SKILLS } from './course-catalog';
import { skillSlug } from './course-matcher';
import type { Course } from './course-provider';

const ALL_SKILLS = COURSES.flatMap((c) => c.skillTags);

/** Slugs de skill — inclui compostos como "power-bi" via POPULAR_SKILLS. */
export function allSkillSlugs(): string[] {
  const slugs = new Set<string>();
  ALL_SKILLS.forEach((s) => slugs.add(skillSlug(s)));
  POPULAR_SKILLS.forEach((s) => slugs.add(skillSlug(s)));
  return [...slugs];
}

/** Nome de exibição: skill exata do catálogo ou derivação legível do slug. */
export function skillFromSlug(slug: string): string {
  for (const skill of ALL_SKILLS) {
    if (skillSlug(skill) === slug) return skill;
  }
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Cursos que cobrem a skill do slug (match por todos os tokens). */
export function coursesForSlug(slug: string): Course[] {
  const slugTokens = slug.split('-').filter(Boolean);
  if (slugTokens.length === 0) return [];
  return COURSES.filter((c) =>
    slugTokens.every((token) =>
      c.skillTags.some((tag) => skillSlug(tag).split('-').includes(token)),
    ),
  );
}
