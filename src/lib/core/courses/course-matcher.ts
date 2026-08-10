// Módulo puro de recomendação de cursos por skill/área.
// Espelha o padrão de src/lib/core/matching/recommendation.ts: funções
// determinísticas e testáveis, sem dependência de banco ou LLM.

import { COURSES } from './course-catalog';
import type { Course } from './course-provider';

/**
 * Áreas consideradas tech. Quando o perfil é tech, cursos Alura (formação
 * ampla) sobem no ranking; caso contrário, cursos Udemy (ferramentas pontuais)
 * são priorizados.
 */
export const TECH_AREAS = [
  'tecnologia',
  'programacao',
  'desenvolvimento',
  'dev',
  'devops',
  'dados',
  'data',
  'ia',
  'inteligencia artificial',
  'produto',
  'ux',
  'backend',
  'frontend',
  'mobile',
  'cloud',
  'qa',
  'engenharia',
];

const MAX_PER_PROVIDER = 2;

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
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function isTechArea(area: string | null | undefined): boolean {
  if (!area) return false;
  const normalized = normalize(area);
  return TECH_AREAS.some((a) => normalized.includes(a));
}

function featuredCourses(limit: number): Course[] {
  return COURSES.filter((c) => c.featured).slice(0, limit);
}

/**
 * Recomenda até `limit` cursos a partir de termos de busca (cargos/skills) e
 * da área do perfil. Roteamento: área tech → Alura primeiro; demais → Udemy.
 * Cap: no máximo MAX_PER_PROVIDER cursos por plataforma. Sem match → featured.
 */
export function recommendCourses(
  terms: string[],
  area?: string | null,
  limit = 4,
): Course[] {
  const queryTokens = new Set(expandTokens(terms.flatMap(tokenize)));
  if (queryTokens.size === 0) return featuredCourses(limit);

  const tech = isTechArea(area);

  const scored = COURSES.map((course) => {
    const tags = new Set(expandTokens(course.skillTags.flatMap(tokenize)));
    let match = 0;
    queryTokens.forEach((t) => {
      if (tags.has(t)) match++;
    });
    return { course, match };
  }).filter((s) => s.match > 0);

  scored.sort((a, b) => {
    if (tech && a.course.provider !== b.course.provider) {
      return a.course.provider === 'alura' ? -1 : 1;
    }
    return b.match - a.match;
  });

  const counts: Record<Course['provider'], number> = { alura: 0, udemy: 0 };
  const result: Course[] = [];

  for (const { course } of scored) {
    if (counts[course.provider] >= MAX_PER_PROVIDER) continue;
    if (result.length >= limit) break;
    counts[course.provider]++;
    result.push(course);
  }

  return result.length > 0 ? result : featuredCourses(limit);
}