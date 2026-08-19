// Merge de recomendações de cursos: catálogo curado + enriquecimento da API
// Impact. Funções puras e determinísticas (sem DB/LLM) — espelha o padrão de
// course-matcher.ts, testável isoladamente.

import type { Course } from './course-provider';

/** Skills sem match no catálogo curado (comparação por substring dos skillTags). */
export function findUnmatchedSkills(skills: string[], courses: Course[]): string[] {
  const matchedTags = courses.flatMap((c) => c.skillTags);
  return skills.filter(
    (s) =>
      !matchedTags.some(
        (t) =>
          t.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(t.toLowerCase()),
      ),
  );
}

/**
 * Monta a lista final de até `limit` cursos garantindo cobertura de skills:
 * reserva um slot para cada skill sem match no catálogo (1 curso da API por
 * skill, na ordem), e o restante é preenchido pelo catálogo curado (ranqueado).
 * Sem duplicatas por id. `searchedSkills`/`apiResults` são alinhados por índice.
 */
export function mergeCourseRecommendations(
  curated: Course[],
  searchedSkills: string[],
  apiResults: Course[][],
  limit: number,
): Course[] {
  const seen = new Set<string>();

  // 1. Um curso da API por skill sem match no catálogo.
  const apiPicks: Course[] = [];
  for (let i = 0; i < searchedSkills.length && apiPicks.length < limit; i++) {
    const pick = (apiResults[i] ?? []).find((c) => !seen.has(c.id));
    if (pick) {
      seen.add(pick.id);
      apiPicks.push(pick);
    }
  }

  // 2. Catálogo curado preenche o restante (reservando os slots da API).
  const result: Course[] = [];
  for (const c of curated) {
    if (result.length + apiPicks.length >= limit) break;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    result.push(c);
  }

  return [...result, ...apiPicks];
}