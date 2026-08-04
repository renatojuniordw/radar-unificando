/** Retorna valores únicos não-vazios, preservando a ordem de primeira ocorrência. */
export function uniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr.filter(Boolean))];
}