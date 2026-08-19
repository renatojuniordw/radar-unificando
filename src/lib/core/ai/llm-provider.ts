import { z } from 'zod';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { API_ENDPOINTS } from '@/lib/core/constants';
import { isLlmTimeout } from './shared/with-timeout';

const baseURL = process.env.AI_BASE_URL || API_ENDPOINTS.openaiBase;
const apiKey = process.env.AI_API_KEY || '';
const modelName = process.env.AI_MODEL || 'gpt-4o-mini';

export const LLM_TIMEOUT_MS = 120_000;

/** Prompt como string única ou separado em system + user. */
export type LlmPrompt = string | { system: string; user: string };

const provider = createOpenAICompatible({
  name: 'llm',
  baseURL,
  apiKey,
  // Exige o chunk final de usage no streaming (stream_options.include_usage).
  // Sem isso, provedores OpenAI-compatíveis não reportam tokens e o medidor
  // de consumo do chat fica travado em 0.
  includeUsage: true,
});

export const chatLlm = provider.chatModel(modelName);

// --- Direct fetch for JSON extraction (bypasses AI SDK reasoning_content issues) ---

interface LlmOptions {
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /** Override do timeout interno (default: LLM_TIMEOUT_MS). */
  timeoutMs?: number;
}

export async function generate<T extends z.ZodType>(
  schema: T,
  prompt: LlmPrompt,
  opts?: LlmOptions,
): Promise<z.infer<T>> {
  try {
    return await callLlm(schema, prompt, opts);
  } catch (err) {
    // Alguns modelos (esp. reasoning models roteados transparentemente) queimam
    // todo o orçamento de tokens em chain-of-thought oculto e nunca chegam ao JSON.
    // Retry uma vez com mais espaço e um nudge mais forte antes de desistir.
    // Também retenta em timeout (AbortError) — provedores lentos podem estourar
    // o AbortSignal.timeout em picos de carga, e um único retry costuma passar.
    const isTimeout = isLlmTimeout(err);
    const isMissingJson = err instanceof Error && err.message === 'JSON não encontrado na resposta';
    const isTokenLimit = err instanceof Error && err.message === 'LLM_TOKEN_LIMIT';
    if (isMissingJson || isTimeout || isTokenLimit) {
      // Signal já abortado (ex.: timeout do withTimeout): o retry seria um fetch
      // que aborta na hora — rethrow para o caller decidir (ele retenta com um
      // novo withTimeout). O retry interno continua válido para o timeout de 120s,
      // onde o signal do chamador NÃO está abortado.
      if (opts?.signal?.aborted) throw err;
      const retryPrompt = isTokenLimit
        ? buildRetryPrompt(prompt, 'CRITICAL: Start your response with "{" immediately. No reasoning, no explanation, no thinking aloud — ONLY the raw JSON object.')
        : buildRetryPrompt(prompt, 'não pense em voz alta nem explique seu raciocínio. Responda IMEDIATAMENTE apenas com o JSON, sem nenhum texto antes.');
      return await callLlm(
        schema,
        retryPrompt,
        {
          maxOutputTokens: Math.max((opts?.maxOutputTokens ?? 1500) * 2, 4000),
          signal: opts?.signal,
        },
      );
    }
    throw err;
  }
}

async function callLlm<T extends z.ZodType>(
  schema: T,
  prompt: LlmPrompt,
  opts?: LlmOptions,
): Promise<z.infer<T>> {
  const messages = typeof prompt === 'string'
    ? [{ role: 'user', content: prompt }]
    : [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ];

  const bodyPayload: Record<string, unknown> = {
    model: modelName,
    messages,
    stream: false,
    response_format: { type: 'json_object' },
    // Alguns provedores roteiam para modelos de raciocínio que narram
    // chain-of-thought antes do JSON. Esses campos pedem para pular o
    // raciocínio quando o provedor os suporta; se não suportar, são
    // ignorados silenciosamente (compatível com a spec OpenAI).
    reasoning_effort: 'low',
    chat_template_kwargs: { enable_thinking: false },
    // max_completion_tokens inclui reasoning tokens no limite (OpenAI spec).
    // max_tokens pode não limitar reasoning tokens em modelos deepseek.
    ...(opts?.maxOutputTokens ? { max_completion_tokens: opts.maxOutputTokens } : {}),
  };

  const timeoutMs = opts?.timeoutMs ?? LLM_TIMEOUT_MS;

  let res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: opts?.signal
      ? AbortSignal.any([opts.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs),
  });

  // Fallback if provider doesn't support response_format (400 or 403)
  if (!res.ok && (res.status === 400 || res.status === 403)) {
    const errBody = await res.text().catch(() => '');
    console.warn(`[llm-provider] ${res.status} — retrying without response_format`, errBody);
    delete bodyPayload.response_format;
    delete bodyPayload.reasoning_effort;
    delete bodyPayload.chat_template_kwargs;
    res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: opts?.signal
        ? AbortSignal.any([opts.signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs),
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;
  const finishReason: string | undefined = data.choices?.[0]?.finish_reason;
  const content: string = choice?.content || choice?.reasoning_content || '';

  // Log token usage para calibrar timeouts e max_tokens
  const usage = data.usage;
  if (usage) {
    console.log('[llm-provider] token_usage:', JSON.stringify({
      model: modelName,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      finish_reason: finishReason,
      max_completion_tokens: opts?.maxOutputTokens,
    }));
  }

  if (!content) {
    console.error('[llm-provider] Resposta vazia da LLM (choices vazia ou content ausente)');
    throw new Error('Resposta vazia da LLM');
  }

  // Fast-fail: modelo queimou todos os tokens em raciocínio sem gerar JSON
  if (finishReason === 'length') {
    console.error('[llm-provider] finishReason=length — tokens esgotados sem gerar JSON:', {
      model: modelName,
      maxTokens: opts?.maxOutputTokens,
      contentLength: content.length,
    });
    throw new Error('LLM_TOKEN_LIMIT');
  }

  try {
    const jsonString = extractJson(content);
    const parsed = JSON.parse(jsonString);
    return schema.parse(parsed);
  } catch (err) {
    console.error('[llm-provider] Erro ao analisar JSON da LLM:', {
      error: err instanceof Error ? err.message : String(err),
      finishReason,
      contentLength: content.length,
    });
    throw err instanceof Error ? err : new Error(String(err));
  }
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown codeblocks
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1').trim();
  }

  // Reasoning models often narrate example JSON shapes before the real
  // answer (e.g. `"skills": [...]`). Find every balanced, string-aware
  // {...} span and take the last one that actually parses as JSON,
  // since the real answer comes after the narration.
  const candidates = findBalancedObjects(cleaned);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i].replace(/,\s*([}\]])/g, '$1');
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // try the previous candidate
    }
  }

  throw new Error('JSON não encontrado na resposta');
}

function findBalancedObjects(text: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let startIdx = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          results.push(text.slice(startIdx, i + 1));
          startIdx = -1;
        }
      }
    }
  }

  return results;
}

/** Adiciona nudge de retry ao prompt, preservando a separação system/user. */
function buildRetryPrompt(prompt: LlmPrompt, nudge: string): LlmPrompt {
  if (typeof prompt === 'string') {
    return prompt + '\n\nIMPORTANTE: ' + nudge;
  }
  return {
    system: prompt.system + '\n\nIMPORTANTE: ' + nudge,
    user: prompt.user,
  };
}
