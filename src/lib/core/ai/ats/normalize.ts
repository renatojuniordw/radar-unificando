// ---------------------------------------------------------------------------
// Normalização de keywords: trata variações como equivalentes (Backend/Back-end,
// Spring/Spring Boot, Java/Java EE) para deduplicar saídas do LLM.
// ---------------------------------------------------------------------------

/** Normaliza uma keyword: minúsculas, sem acentos, sem hífens/espaços/pontuação. */
export function normalizeKeyword(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Mantém "+" e "#": são significativos em nomes de linguagem (C++, C#).
    .replace(/[^a-z0-9+#]/g, '')
    .trim();
}

/** Deduplica mantendo a primeira ocorrência, usando a forma normalizada como chave. */
export function dedupeKeywords(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeKeyword(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}