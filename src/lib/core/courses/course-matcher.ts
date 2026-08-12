// Módulo puro de recomendação de cursos por skill/área.
// Espelha o padrão de src/lib/core/matching/recommendation.ts: funções
// determinísticas e testáveis, sem dependência de banco ou LLM.

import { COURSES } from './course-catalog';
import type { Course } from './course-provider';
import { removeAccents } from '@/lib/utils/string';

/** Sinônimos/gírias comuns de skills → token canônico do catálogo. */
const SKILL_SYNONYMS: Record<string, string> = {
  k8s: 'kubernetes',
  bi: 'power',
  ml: 'machine',
  dba: 'banco',
  english: 'ingles',
  idioma: 'ingles',
  idiomas: 'ingles',
  dev: 'desenvolvimento',
  js: 'javascript',
  ts: 'typescript',
  ux: 'design',
  sql: 'banco',
  gestao: 'management',
};

function normalize(text: string): string {
  return removeAccents(text).toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Slug de skill para rotas SEO (ex.: "Power BI" → "power-bi"). */
export function skillSlug(skill: string): string {
  return normalize(skill)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Expande tokens por sinônimos (ex.: k8s → kubernetes) para aumentar o match. */
export function expandTokens(tokens: string[]): string[] {
  const expanded = [...tokens];
  for (const token of tokens) {
    const canonical = SKILL_SYNONYMS[token];
    if (canonical && !expanded.includes(canonical)) {
      expanded.push(canonical);
    }
  }
  return expanded;
}

function featuredCourses(limit: number): Course[] {
  return COURSES.filter((c) => c.featured).slice(0, limit);
}

/**
 * Recomenda até `limit` cursos a partir de termos de busca (cargos/skills),
 * ranqueados pelo número de skillTags em comum. Sem match → featured.
 * `area` é aceito para compatibilidade com os chamadores (perfil do usuário)
 * mas não afeta o ranking hoje — catálogo é 100% Udemy.
 */
export function recommendCourses(
  terms: string[],
  area?: string | null,
  limit = 4,
): Course[] {
  const queryTokens = new Set(expandTokens(terms.flatMap(tokenize)));
  if (queryTokens.size === 0) return featuredCourses(limit);

  const scored = COURSES.map((course) => {
    const tags = new Set(expandTokens(course.skillTags.flatMap(tokenize)));
    let match = 0;
    queryTokens.forEach((t) => {
      if (tags.has(t)) match++;
    });
    return { course, match };
  })
    .filter((s) => s.match > 0)
    .sort((a, b) => b.match - a.match);

  const result = scored.slice(0, limit).map((s) => s.course);
  return result.length > 0 ? result : featuredCourses(limit);
}