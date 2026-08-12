/**
 * Remove acentos de um texto usando normalização Unicode NFD.
 * Função utilitária centralizada para evitar duplicação do padrão
 * `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` no codebase.
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
