import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    $transaction: vi.fn(),
    chat: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    chatMessage: { deleteMany: vi.fn(), createMany: vi.fn(), count: vi.fn() },
    chatUsage: { create: vi.fn(), aggregate: vi.fn(), findFirst: vi.fn() },
    chatToolCall: { createMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { chatRepository } from '@/lib/infrastructure/repositories/chat-repository';

const chat = vi.mocked(prisma.chat);
const message = vi.mocked(prisma.chatMessage);
const usage = vi.mocked(prisma.chatUsage);

function content(parts: Array<{ type: string; text: string }>): object {
  return { parts } as object;
}

describe('chatRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation((ops: any[]) => Promise.all(ops) as any);
  });

  it('getMessages_retorna_vazio_quando_chat_nao_existe', async () => {
    chat.findUnique.mockResolvedValue(null);
    expect(await chatRepository.getMessages('u1', 'chat-1')).toEqual([]);
  });

  it('getMessages_retorna_conteudos_ordenados', async () => {
    chat.findUnique.mockResolvedValue({
      messages: [
        { content: content([{ type: 'text', text: 'oi' }]) },
        { content: content([{ type: 'text', text: 'tudo bem' }]) },
      ],
    } as any);
    const messages = await chatRepository.getMessages('u1', 'chat-1');
    expect(messages).toHaveLength(2);
  });

  it('replaceMessages_define_titulo_pela_primeira_msg_de_usuario', async () => {
    chat.upsert.mockResolvedValue({ id: 'chat-1', title: null } as any);
    chat.update.mockResolvedValue({} as any);
    await chatRepository.replaceMessages('u1', 'chat-1', [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Quero vagas de DevOps em São Paulo' }] },
      { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Claro!' }] },
    ]);
    expect(chat.update).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(message.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Array) }),
    );
  });

  it('replaceMessages_nao_atualiza_titulo_quando_ja_existe', async () => {
    chat.upsert.mockResolvedValue({ id: 'chat-1', title: 'Titulo' } as any);
    await chatRepository.replaceMessages('u1', 'chat-1', [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'oi' }] }]);
    expect(chat.update).not.toHaveBeenCalled();
  });

  it('replaceMessages_sem_msg_de_usuario_nao_define_titulo', async () => {
    chat.upsert.mockResolvedValue({ id: 'chat-1', title: null } as any);
    await chatRepository.replaceMessages('u1', 'chat-1', [{ id: 'm1', role: 'assistant', parts: [{ type: 'text', text: 'oi' }] }]);
    expect(chat.update).not.toHaveBeenCalled();
  });

  it('listChats_filtra_chats_sem_mensagens_e_deriva_titulo', async () => {
    chat.findMany.mockResolvedValue([
      {
        externalId: 'chat-1',
        title: null,
        createdAt: new Date('2024-01-01'),
        messages: [{ content: content([{ type: 'text', text: 'Primeira mensagem longa aqui' }]) }],
      },
      { externalId: 'chat-2', title: null, createdAt: new Date(), messages: [] },
    ] as any);
    const summaries = await chatRepository.listChats('u1');
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe('Primeira mensagem longa aqui');
  });

  it('getDailyUserMessageCount_conta_mensagens_do_dia', async () => {
    message.count.mockResolvedValue(7);
    expect(await chatRepository.getDailyUserMessageCount('u1')).toBe(7);
    expect(message.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
  });

  it('recordUsage_grava_totais_calculados', async () => {
    usage.create.mockResolvedValue({} as any);
    await chatRepository.recordUsage('u1', { chatId: 'chat-1', promptTokens: 10, completionTokens: 20, ipHash: 'hash' });
    expect(usage.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        chatId: 'chat-1',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        ipHash: 'hash',
      },
    });
  });

  it('recordToolCalls_grava_uma_linha_por_ferramenta', async () => {
    (prisma.chatToolCall.createMany as any).mockResolvedValue({ count: 2 });
    await chatRepository.recordToolCalls('u1', ['search_jobs', 'analyze_ats_score']);
    expect(prisma.chatToolCall.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'u1', toolName: 'search_jobs' },
        { userId: 'u1', toolName: 'analyze_ats_score' },
      ],
    });
  });

  it('recordToolCalls_ignora_lista_vazia', async () => {
    await chatRepository.recordToolCalls('u1', []);
    expect(prisma.chatToolCall.createMany).not.toHaveBeenCalled();
  });

  it('sumTokensSince_trata_somas_nulas_como_zero', async () => {
    usage.aggregate.mockResolvedValue({ _sum: { promptTokens: null, completionTokens: null, totalTokens: null } } as any);
    const totals = await chatRepository.sumTokensSince(['u1'], new Date());
    expect(totals).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it('sumTokensSinceByIp_soma_tokens_do_ip', async () => {
    usage.aggregate.mockResolvedValue({ _sum: { promptTokens: 5, completionTokens: 3, totalTokens: 8 } } as any);
    const totals = await chatRepository.sumTokensSinceByIp('hash', new Date());
    expect(totals.totalTokens).toBe(8);
  });

  it('getLastContextTokens_retorna_null_sem_registro', async () => {
    usage.findFirst.mockResolvedValue(null);
    expect(await chatRepository.getLastContextTokens('u1')).toBeNull();
  });

  it('getLastContextTokens_com_chatId_filtra_por_chat', async () => {
    usage.findFirst.mockResolvedValue({ promptTokens: 99 } as any);
    expect(await chatRepository.getLastContextTokens('u1', 'chat-1')).toBe(99);
    expect(usage.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1', chatId: 'chat-1' } }));
  });

  it('deleteChat_remove_mensagens_do_chat', async () => {
    chat.deleteMany.mockResolvedValue({ count: 1 } as any);
    await chatRepository.deleteChat('u1', 'chat-1');
    expect(chat.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', externalId: 'chat-1' } });
  });
});
