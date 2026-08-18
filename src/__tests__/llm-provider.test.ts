import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: () => ({
    chatModel: () => ({}),
  }),
}));

import { generate } from '@/lib/core/ai/llm-provider';

const scoreSchema = z.object({ score: z.number() });

function jsonResponse(content: string, status = 200) {
  return {
    ok: status === 200,
    status,
    text: async () => '',
    json: async () => ({ choices: [{ message: { content } }] }),
  } as Response;
}

const fetchMock = vi.fn();

describe('llm-provider.generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should_parse_valid_json_response', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"score": 87}'));
    const result = await generate(scoreSchema, 'analise');
    expect(result.score).toBe(87);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages[0].content).toBe('analise');
  });

  it('should_extract_json_from_markdown_codeblock', async () => {
    fetchMock.mockResolvedValue(jsonResponse('```json\n{"score": 42}\n```'));
    expect((await generate(scoreSchema, 'x')).score).toBe(42);
  });

  it('should_retry_without_response_format_on_400', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse('', 400))
      .mockResolvedValueOnce(jsonResponse('{"score": 10}'));
    const result = await generate(scoreSchema, 'x');
    expect(result.score).toBe(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should_propagate_http_error_with_status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' } as Response);
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('LLM API 500');
  });

  it('should_reject_empty_llm_response', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '' } }] }) } as Response);
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('Resposta vazia da LLM');
  });

  it('should_retry_once_when_json_not_found_then_propagate', async () => {
    fetchMock.mockResolvedValue(jsonResponse('texto sem json nenhum'));
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('JSON não encontrado na resposta');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should_use_last_valid_json_block_after_narration', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse('exemplo: {"score": 1} resposta real: {"score": 99}'),
    );
    expect((await generate(scoreSchema, 'x')).score).toBe(99);
  });

  it('should_reject_when_json_fails_schema_parse', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"outro_campo": true}'));
    await expect(generate(scoreSchema, 'x')).rejects.toThrow();
  });

  it('should_combine_external_signal_with_timeout_signal', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"score": 87}'));
    const controller = new AbortController();
    await generate(scoreSchema, 'x', { signal: controller.signal });
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
    controller.abort();
    expect(signal.aborted).toBe(true);
  });

  it('should_not_retry_when_external_signal_is_already_aborted', async () => {
    // Simula o timeout do withTimeout: o signal do chamador aborta, o fetch
    // rejeita com AbortError e o retry interno NÃO deve disparar (seria um
    // fetch que aborta na hora). O caller decide o retry com um novo withTimeout.
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const controller = new AbortController();
    controller.abort();
    await expect(generate(scoreSchema, 'x', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should_scale_max_output_tokens_by_three_min_8000_on_retry', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse('texto sem json nenhum'))
      .mockResolvedValueOnce(jsonResponse('{"score": 87}'));
    await generate(scoreSchema, 'x', { maxOutputTokens: 1000 });
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(firstBody.max_tokens).toBe(1000);
    expect(retryBody.max_tokens).toBe(8000);
  });

  it('should_include_reasoning_effort_and_thinking_disable_fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"score": 87}'));
    await generate(scoreSchema, 'x');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.reasoning_effort).toBe('low');
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
  });
});
