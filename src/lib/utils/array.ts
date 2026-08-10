/** Retorna valores únicos não-vazios, preservando a ordem de primeira ocorrência. */
export function uniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr.filter(Boolean))];
}

/** Deduplica por uma chave derivada, preservando a primeira ocorrência. */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}