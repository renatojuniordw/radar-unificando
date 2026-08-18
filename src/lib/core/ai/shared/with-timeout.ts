// ---------------------------------------------------------------------------
// Timeout de LLM que efetivamente cancela a chamada em vez de só abandonar a
// promise: expõe um AbortSignal pro chamador repassar pro `generate()`, então
// quando o tempo estoura o fetch subjacente é abortado de verdade (em vez de
// continuar rodando em segundo plano até o timeout interno de 120s).
// ---------------------------------------------------------------------------

export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timerId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      reject(new Error("LLM_TIMEOUT"));
    }, ms);
  });

  return Promise.race([run(controller.signal), timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}
