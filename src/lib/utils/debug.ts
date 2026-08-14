/**
 * Log de depuração: emitido apenas fora de produção.
 * Substitui `console.log` em hot paths e logs com dados de usuário,
 * que não devem poluir nem vazar PII em logs de produção.
 */
export function debugLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'production') return;
  console.log(...args);
}
