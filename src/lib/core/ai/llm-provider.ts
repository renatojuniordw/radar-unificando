import { z } from 'zod';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const baseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const apiKey = process.env.AI_API_KEY || '';
const modelName = process.env.AI_MODEL || 'deepseek-v4-flash';

export const LLM_TIMEOUT_MS = 120_000;

const provider = createOpenAICompatible({
  name: 'llm',
  baseURL,
  apiKey,
});

export const chatLlm = provider.chatModel(modelName);

// --- Direct fetch for JSON extraction (bypasses AI SDK reasoning_content issues) ---

interface LlmOptions {
  maxOutputTokens?: number;
}

export async function generate<T extends z.ZodType>(
  schema: T,
  prompt: string,
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
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
    const isMissingJson = err instanceof Error && err.message === 'JSON não encontrado na resposta';
    if (isMissingJson || isTimeout) {
      return await callLlm(
        schema,
        prompt +
          '\n\nIMPORTANTE: não pense em voz alta nem explique seu raciocínio. Responda IMEDIATAMENTE apenas com o JSON, sem nenhum texto antes.',
        { maxOutputTokens: Math.max((opts?.maxOutputTokens ?? 1500) * 2, 4000) },
      );
    }
    throw err;
  }
}

async function callLlm<T extends z.ZodType>(
  schema: T,
  prompt: string,
  opts?: LlmOptions,
): Promise<z.infer<T>> {
  const bodyPayload: Record<string, unknown> = {
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    response_format: { type: 'json_object' },
    ...(opts?.maxOutputTokens ? { max_tokens: opts.maxOutputTokens } : {}),
  };

  let res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  // Fallback if provider doesn't support response_format
  if (!res.ok && res.status === 400) {
    delete bodyPayload.response_format;
    res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;
  const content: string = choice?.content || choice?.reasoning_content || '';

  if (!content) {
    console.error('[llm-provider] Resposta vazia da LLM:', data);
    throw new Error('Resposta vazia da LLM');
  }

  try {
    const jsonString = extractJson(content);
    const parsed = JSON.parse(jsonString);
    return schema.parse(parsed);
  } catch (err) {
    console.error('[llm-provider] Erro ao analisar JSON da LLM:', {
      error: err instanceof Error ? err.message : String(err),
      rawContentSnippet: content.slice(0, 300),
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
