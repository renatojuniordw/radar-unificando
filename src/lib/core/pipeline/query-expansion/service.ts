import { canonicalQuery, dedupeQueries } from './normalize';
import { getMapExpansion } from './map';
import { getExpansion, setExpansion } from './cache';
import { generateAiExpansion, sanitizeVariants } from '@/lib/core/ai/query-expansion';

export const MAX_EXPANDED_QUERIES = 30;

/**
 * Single-flight: evita chamada dupla à LLM quando duas execuções (ex.: busca
 * manual + auto-sync) batem no mesmo cache-miss ao mesmo tempo.
 */
const inFlight = new Map<string, Promise<string[]>>();

/**
 * Expande UMA query: mapa curado → cache → LLM. Sempre inclui a query original.
 * Fail-open por query: qualquer erro (cache, LLM) cai para [query] sem gravar cache.
 */
async function expandOne(query: string): Promise<string[]> {
  try {
    const canonical = canonicalQuery(query);

    const mapHit = getMapExpansion(query);
    if (mapHit) return [query, ...mapHit];

    const cached = await getExpansion(canonical);
    if (cached) return [query, ...cached];

    const pending = inFlight.get(canonical);
    if (pending) return [query, ...(await pending)];

    const run = (async () => {
      const variants = await generateAiExpansion(query);
      const clean = sanitizeVariants(variants, query);
      if (clean.length > 0) await setExpansion(canonical, clean); // só grava em sucesso
      return clean;
    })().finally(() => {
      inFlight.delete(canonical);
    });

    inFlight.set(canonical, run);
    return [query, ...(await run)];
  } catch {
    return [query]; // fail-open: segue só com a original
  }
}

/**
 * Expande a lista de queries: deduplica a entrada, expande cada uma
 * (fail-open), deduplica o resultado e limita o total. NUNCA lança.
 */
export async function expandQueries(queries: string[]): Promise<string[]> {
  try {
    const unique = dedupeQueries(queries);
    const sets = await Promise.all(unique.map(expandOne));
    const deduped = dedupeQueries(sets.flat());
    // Originais sempre primeiro, para o corte nunca descartar uma query do usuário.
    const variantsOnly = deduped.filter((query) => !unique.includes(query));
    return [...unique, ...variantsOnly].slice(0, MAX_EXPANDED_QUERIES);
  } catch {
    return dedupeQueries(queries); // fail-open absoluto
  }
}