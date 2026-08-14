import { removeAccents } from '@/lib/utils/string';

/**
 * Forma canônica de uma query: minúsculas, sem acentos, tokens ordenados.
 * Faz "UX/UI Designer" e "UI/UX Designer" colapsarem na mesma forma.
 */
export function canonicalQuery(query: string): string {
  return removeAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

/**
 * Mantém a primeira ocorrência de cada forma canônica e descarta
 * consultas vazias ou sem tokens (ex.: espaços, "!@#").
 */
export function dedupeQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const canonical = canonicalQuery(query);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(query);
  }
  return result;
}