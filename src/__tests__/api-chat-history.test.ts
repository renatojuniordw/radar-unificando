import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  chatRepository: {
    getMessages: vi.fn(),
    replaceMessages: vi.fn(),
    deleteChat: vi.fn(),
  },
}));
vi.mock('@/lib/core/ai/pii-redactor', () => ({
  sanitizePiiInObject: vi.fn((m: unknown) => m),
}));

import { chatRepository } from '@/lib/infrastructure/repositories';
import { GET, POST, DELETE } from '@/app/api/chat/history/route';

function makeRequest(url = 'http://localhost/api/chat/history?chatId=abc'): NextRequest {
  return {
    url,
    json: async () => ({ chatId: 'abc', messages: [{ role: 'user', content: 'oi' }] }),
  } as any;
}

describe('Chat History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('should_return_messages_on_get', async () => {
    vi.mocked(chatRepository.getMessages).mockResolvedValue([{ role: 'user', content: 'oi' }] as any);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect((await res.json()).messages).toHaveLength(1);
    expect(chatRepository.getMessages).toHaveBeenCalledWith('user-1', 'abc');
  });

  it('should_default_chat_id_to_default', async () => {
    vi.mocked(chatRepository.getMessages).mockResolvedValue([]);
    await GET(makeRequest('http://localhost/api/chat/history'));
    expect(chatRepository.getMessages).toHaveBeenCalledWith('user-1', 'default');
  });

  it('should_return_empty_messages_on_get_error', async () => {
    vi.mocked(chatRepository.getMessages).mockRejectedValue(new Error('db down'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).messages).toEqual([]);
  });

  it('should_save_messages_on_post', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(chatRepository.replaceMessages).toHaveBeenCalledWith(
      'user-1',
      'abc',
      [{ role: 'user', content: 'oi' }],
    );
  });

  it('should_return_500_when_post_fails', async () => {
    vi.mocked(chatRepository.replaceMessages).mockRejectedValue(new Error('db down'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Erro ao salvar');
  });

  it('should_delete_chat_on_delete', async () => {
    const res = await DELETE(makeRequest());
    expect(res.status).toBe(200);
    expect(chatRepository.deleteChat).toHaveBeenCalledWith('user-1', 'abc');
  });

  it('should_return_500_when_delete_fails', async () => {
    vi.mocked(chatRepository.deleteChat).mockRejectedValue(new Error('db down'));
    const res = await DELETE(makeRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Erro ao deletar');
  });
});