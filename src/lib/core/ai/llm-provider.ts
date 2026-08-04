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
    // Some models (esp. reasoning models routed transparently) burn the whole
    // token budget on hidden chain-of-thought and never reach the JSON answer.
    // Retry once with more room and a stronger nudge before giving up.
    if (err instanceof Error && err.message === 'JSON não encontrado na resposta') {
      return await callLlm(
        schema,
        prompt +
          '\n\nIMPORTANTE: não pense em voz alta nem explique seu raciocínio. Responda IMEDIATAMENTE apenas com o JSON, sem nenhum texto antes.',
        { maxOutputTokens: (opts?.maxOutputTokens ?? 1500) * 2 },
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
    cleaned = cleaned.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '').trim();
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('JSON não encontrado na resposta');
  }

  let jsonCandidate = cleaned.slice(start, end + 1);
  // Clean trailing commas before closing braces/brackets
  jsonCandidate = jsonCandidate.replace(/,\s*([}\]])/g, '$1');

  return jsonCandidate;
}
