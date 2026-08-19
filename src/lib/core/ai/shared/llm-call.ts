import { z } from 'zod';
import { generate, type LlmPrompt } from '../llm-provider';
import { logAiEvent, type AiEvent } from '../ai-logger';
import { isLlmTimeout, withTimeout } from './with-timeout';

// ---------------------------------------------------------------------------
// Padrão único para chamadas LLM: system/user separation, timeout, retry e
// logging centralizados. Callers só fornecem schema, prompts e opções.
// ---------------------------------------------------------------------------

export interface LlmCallOptions<T extends z.ZodType = z.ZodType> {
  /** Máximo de output tokens para a LLM. */
  maxOutputTokens: number;
  /** Timeout em ms. Default: 35_000. Pass 0 para desabilitar timeout externo. */
  timeoutMs?: number;
  /** Número de retries em caso de timeout. Default: 0. */
  retriesOnTimeout?: number;
  /** Nome do evento para ai-logger. */
  eventName: AiEvent;
  /** Trace ID para logging. */
  traceId?: string;
  /** Mensagem de erro exibida ao usuário em caso de timeout. */
  timeoutErrorMessage?: string;
  /** Mensagem de erro exibida ao usuário em outros falhas. */
  genericErrorMessage?: string;
  /** Dados estáticos extras incluídos no log (mesmo em falha). */
  logData?: Record<string, unknown>;
  /** Transforma o resultado em campos extras de log (apenas sucesso). */
  formatLogData?: (result: z.infer<T>) => Record<string, unknown>;
}

const DEFAULT_TIMEOUT_ERROR = 'A operação demorou mais que o esperado. Tente novamente em instantes.';
const DEFAULT_GENERIC_ERROR = 'Não foi possível completar a operação. Tente novamente.';

export async function llmCall<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
  opts: LlmCallOptions<T>,
): Promise<z.infer<T>> {
  const start = performance.now();
  const prompt: LlmPrompt = { system: systemPrompt, user: userPrompt };
  const {
    maxOutputTokens,
    timeoutMs = 35_000,
    retriesOnTimeout = 0,
    eventName,
    traceId,
    timeoutErrorMessage = DEFAULT_TIMEOUT_ERROR,
    genericErrorMessage = DEFAULT_GENERIC_ERROR,
    logData = {},
    formatLogData,
  } = opts;

  const runOnce = () =>
    timeoutMs > 0
      ? withTimeout(
          (signal) => generate(schema, prompt, { maxOutputTokens, signal }),
          timeoutMs,
        )
      : generate(schema, prompt, { maxOutputTokens });

  const latencyMs = () => Number((performance.now() - start).toFixed(0));

  const logSuccess = (result: z.infer<T>, retried: boolean) => {
    logAiEvent(eventName, {
      traceId,
      latencyMs: latencyMs(),
      success: true,
      ...(retried ? { retried: true } : {}),
      ...logData,
      ...(formatLogData ? formatLogData(result) : {}),
    });
    return result;
  };

  const handleFailure = (err: unknown, wasTimeout: boolean): never => {
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent(eventName, {
      traceId,
      latencyMs: latencyMs(),
      success: false,
      error: message,
      ...logData,
    });
    throw new Error(wasTimeout ? timeoutErrorMessage : genericErrorMessage);
  };

  // 1ª tentativa
  try {
    return await logSuccess(await runOnce(), false);
  } catch (err) {
    if (!isLlmTimeout(err) || retriesOnTimeout <= 0) {
      return handleFailure(err, isLlmTimeout(err));
    }
  }

  // Retry em timeout
  for (let attempt = 1; attempt <= retriesOnTimeout; attempt++) {
    try {
      return await logSuccess(await runOnce(), true);
    } catch (err) {
      if (attempt === retriesOnTimeout || !isLlmTimeout(err)) {
        return handleFailure(err, isLlmTimeout(err));
      }
    }
  }

  throw new Error(genericErrorMessage);
}
