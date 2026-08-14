// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const chatMock = vi.hoisted(() => ({
  state: {
    messages: [] as unknown[],
    sendMessage: vi.fn(),
    status: 'ready',
    setMessages: vi.fn(),
    regenerate: vi.fn(),
  },
}));

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => chatMock.state),
}));

const storageMock = vi.hoisted(() => ({
  getChatId: vi.fn(),
  setChatId: vi.fn(),
  getChatMessages: vi.fn(),
  setChatMessages: vi.fn(),
}));

vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: storageMock,
}));

import { useChatConversation } from '@/hooks/useChatConversation';

const fetchMock = vi.fn();
(globalThis as any).fetch = fetchMock;

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as any;
}
function fail(status = 500) {
  return { ok: false, status, json: async () => ({ error: 'erro' }) } as any;
}

type RouteHandler = (url: string) => Promise<any>;
let routes: Record<string, RouteHandler> = {};

function setupRoutes(handlers: Record<string, RouteHandler>) {
  routes = handlers;
  fetchMock.mockImplementation(async (input: any, init?: any) => {
    const url: string = typeof input === 'string' ? input : String(input.url);
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.startsWith('/api/chat/history')) {
      const handler = routes[`${method} /api/chat/history`];
      if (handler) return handler(url);
    }
    const handler = routes[`${method} ${url}`];
    if (handler) return handler(url);
    return fail(404);
  });
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function settle() {
  for (let i = 0; i < 8; i++) await flush();
}

describe('useChatConversation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    chatMock.state.messages = [];
    chatMock.state.status = 'ready';
    chatMock.state.setMessages.mockImplementation((msgs: unknown[]) => {
      chatMock.state.messages = msgs;
    });
    storageMock.getChatId.mockResolvedValue(null);
    storageMock.setChatId.mockResolvedValue(undefined);
    storageMock.getChatMessages.mockResolvedValue([]);
    storageMock.setChatMessages.mockResolvedValue(undefined);
    setupRoutes({
      'GET /api/chat/usage': () => ok({ count: 3, limit: 50, remaining: 47, isDailyLimitReached: false }),
      'GET /api/chat/context': () => ok({ contextTokens: 1200 }),
      'GET /api/chat/conversations': () =>
        ok([{ id: 'conv-1', title: 'Vagas', lastMessage: 'x', createdAt: new Date().toISOString() }]),
      'GET /api/chat/history': () => ok({ messages: [] }),
      'POST /api/chat/history': () => ok({ ok: true }),
      'DELETE /api/chat/history': () => ok({ ok: true }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cria_chat_id_novo_e_persiste_quando_nao_existe', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    expect(result.current.chatId).toBeTruthy();
    expect(storageMock.setChatId).toHaveBeenCalledWith(result.current.chatId);
  });

  it('reutiliza_chat_id_existente_sem_repersistir', async () => {
    storageMock.getChatId.mockResolvedValue('chat-existing');
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    expect(result.current.chatId).toBe('chat-existing');
    expect(storageMock.setChatId).not.toHaveBeenCalled();
  });

  it('mostra_mensagem_de_boas_vindas_quando_nao_ha_historico', async () => {
    renderHook(() => useChatConversation({ userName: 'Maria', active: false }));
    await settle();

    expect(chatMock.state.messages).toHaveLength(1);
    expect((chatMock.state.messages[0] as any).role).toBe('assistant');
    expect((chatMock.state.messages[0] as any).parts[0].text).toContain('Maria');
  });

  it('carrega_mensagens_do_servidor_quando_existem', async () => {
    routes['GET /api/chat/history'] = () =>
      ok({
        messages: [
          { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Oi' }] },
          { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Olá!' }] },
        ],
      });
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    expect(chatMock.state.messages).toHaveLength(2);
    expect((chatMock.state.messages[1] as any).parts[0].text).toBe('Olá!');
    expect(result.current.syncError).toBe(false);
  });

  it('usa_fallback_local_e_marca_syncError_quando_servidor_falha', async () => {
    routes['GET /api/chat/history'] = () => fail(500);
    storageMock.getChatMessages.mockResolvedValue([
      { role: 'user', parts: [{ type: 'text', text: 'mensagem local' }] },
    ]);
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    expect(chatMock.state.messages).toHaveLength(1);
    expect((chatMock.state.messages[0] as any).parts[0].text).toBe('mensagem local');
    expect(result.current.syncError).toBe(true);
  });

  it('persiste_localmente_e_sincroniza_com_o_servidor_apos_debounce', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    // O effect de persist aguarda isLoaded + mensagens (boas-vindas)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    await settle();

    expect(storageMock.setChatMessages).toHaveBeenCalled();
    const postCall = fetchMock.mock.calls.find(
      (c) => c[1]?.method === 'POST' && String(c[0]).startsWith('/api/chat/history'),
    );
    expect(postCall).toBeTruthy();
    expect(result.current.syncError).toBe(false);
  });

  it('marca_syncError_quando_a_sincronizacao_falha', async () => {
    routes['POST /api/chat/history'] = () => fail(500);
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    await settle();

    expect(result.current.syncError).toBe(true);
  });

  it('carrega_conversas_e_uso_diario_quando_ativo', async () => {
    const { result } = renderHook(() => useChatConversation({ active: true }));
    await settle();

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe('Vagas');
    expect(result.current.dailyUsage.count).toBe(3);
    expect(result.current.dailyUsage.contextTokens).toBe(1200);
  });

  it('selectConversation_troca_o_chat_e_persiste_o_id', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    let returned: boolean;
    await act(async () => {
      returned = result.current.selectConversation('chat-outro');
    });
    expect(returned!).toBe(true);
    expect(storageMock.setChatId).toHaveBeenCalledWith('chat-outro');
    expect(result.current.chatId).toBe('chat-outro');

    let same: boolean;
    await act(async () => {
      same = result.current.selectConversation('chat-outro');
    });
    expect(same!).toBe(false);
  });

  it('startNewConversation_cria_nova_conversa_com_boas_vindas', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();
    const oldId = result.current.chatId;

    await act(async () => {
      result.current.startNewConversation();
    });

    expect(result.current.chatId).not.toBe(oldId);
    expect(chatMock.state.messages).toHaveLength(1);
    expect((chatMock.state.messages[0] as any).role).toBe('assistant');
  });

  it('clearHistory_limpa_mensagens_e_chama_a_api_de_delete', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(chatMock.state.messages).toHaveLength(0);
    expect(storageMock.setChatMessages).toHaveBeenCalledWith([]);
    const delCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'DELETE');
    expect(delCall).toBeTruthy();
  });

  it('clearHistory_marca_syncError_se_o_delete_falhar', async () => {
    routes['DELETE /api/chat/history'] = () => fail(500);
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(result.current.syncError).toBe(true);
  });

  it('dispara_vibracao_quando_a_resposta_da_ia_termina', async () => {
    const vibrateMock = vi.fn();
    const originalVibrate = (navigator as any).vibrate;
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, configurable: true });
    try {
      const { rerender } = renderHook(() => useChatConversation({ active: false }));
      chatMock.state.status = 'streaming';
      rerender();
      chatMock.state.status = 'ready';
      rerender();
      await settle();

      expect(vibrateMock).toHaveBeenCalledWith(15);
    } finally {
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true,
      });
    }
  });

  it('ignora_erro_ao_buscar_context_tokens', async () => {
    routes['GET /api/chat/context'] = () => fail(500);
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    // O fetch falhou silenciosamente — nada é setado (contextTokens != 1200) e o hook não quebra.
    expect(result.current.dailyUsage.count).toBe(3);
    expect(result.current.dailyUsage.contextTokens).not.toBe(1200);
  });

  it('expoe_refreshDailyUsage_e_reload_como_aliases', async () => {
    const { result } = renderHook(() => useChatConversation({ active: false }));
    await settle();

    expect(result.current.reload).toBe(chatMock.state.regenerate);
    await act(async () => {
      await result.current.refreshDailyUsage();
    });
    expect(result.current.dailyUsage.count).toBe(3);
  });
});
