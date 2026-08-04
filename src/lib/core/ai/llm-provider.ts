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
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      ...(opts?.maxOutputTokens ? { max_tokens: opts.maxOutputTokens } : {}),
    }),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(extractJson(content));
  return schema.parse(parsed);
}

function extractJson(raw: string): string {
  const cleaned = raw.trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('JSON não encontrado na resposta');
  }
  return cleaned.slice(start, end + 1);
}
