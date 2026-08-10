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

  it('parseia_json_valido_da_resposta', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"score": 87}'));
    const result = await generate(scoreSchema, 'analise');
    expect(result.score).toBe(87);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages[0].content).toBe('analise');
  });

  it('extrai_json_dentro_de_codeblock_markdown', async () => {
    fetchMock.mockResolvedValue(jsonResponse('```json\n{"score": 42}\n```'));
    expect((await generate(scoreSchema, 'x')).score).toBe(42);
  });

  it('retenta_sem_response_format_quando_api_responde_400', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse('', 400))
      .mockResolvedValueOnce(jsonResponse('{"score": 10}'));
    const result = await generate(scoreSchema, 'x');
    expect(result.score).toBe(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('propaga_erro_http_com_status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' } as Response);
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('LLM API 500');
  });

  it('rejeita_resposta_vazia_da_llm', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '' } }] }) } as Response);
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('Resposta vazia da LLM');
  });

  it('retenta_uma_vez_quando_json_nao_encontrado_e_entao_propaga', async () => {
    fetchMock.mockResolvedValue(jsonResponse('texto sem json nenhum'));
    await expect(generate(scoreSchema, 'x')).rejects.toThrow('JSON não encontrado na resposta');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('usa_o_ultimo_bloco_json_valido_apos_narracao', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse('exemplo: {"score": 1} resposta real: {"score": 99}'),
    );
    expect((await generate(scoreSchema, 'x')).score).toBe(99);
  });

  it('rejeita_quando_json_nao_parseia_no_schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse('{"outro_campo": true}'));
    await expect(generate(scoreSchema, 'x')).rejects.toThrow();
  });
});
