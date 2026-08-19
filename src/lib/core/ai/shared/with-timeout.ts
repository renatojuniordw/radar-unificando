// ---------------------------------------------------------------------------
// Timeout de LLM que efetivamente cancela a chamada em vez de só abandonar a
// promise: expõe um AbortSignal pro chamador repassar pro `generate()`, então
// quando o tempo estoura o fetch subjacente é abortado de verdade (em vez de
// continuar rodando em segundo plano até o timeout interno de 120s).
// ---------------------------------------------------------------------------

/** True para erros de abort/timeout (AbortError/TimeoutError) — usados tanto
 * pelo withTimeout quanto pelo AbortSignal.timeout interno do llm-provider.
 * Não usa `instanceof Error`: o reason de um AbortController é um DOMException,
 * que em Node NÃO é instância de Error. */
export function isLlmTimeout(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err.name === 'AbortError' || err.name === 'TimeoutError')
  );
}

export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timerId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      // Rejeita com o reason do controller (DOMException AbortError) para que
      // ambos os caminhos do race produzam o mesmo tipo de erro — o caller
      // distingue via isLlmTimeout, independente de quem venceu o race.
      reject(controller.signal.reason);
    }, ms);
  });

  return Promise.race([run(controller.signal), timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}
