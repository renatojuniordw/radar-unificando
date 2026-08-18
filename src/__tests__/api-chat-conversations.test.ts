import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  chatRepository: {
    listChats: vi.fn(),
  },
}));

import { chatRepository } from '@/lib/infrastructure/repositories';
import { GET } from '@/app/api/chat/conversations/route';

describe('Chat Conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('should_return_conversations', async () => {
    vi.mocked(chatRepository.listChats).mockResolvedValue([{ id: 'abc', title: 'Chat' }] as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'abc', title: 'Chat' }]);
    expect(chatRepository.listChats).toHaveBeenCalledWith('user-1');
  });

  it('should_return_empty_list_on_error', async () => {
    vi.mocked(chatRepository.listChats).mockRejectedValue(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual([]);
  });
});