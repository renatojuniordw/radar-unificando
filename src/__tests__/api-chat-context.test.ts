import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  chatRepository: {
    getLastContextTokens: vi.fn(),
  },
}));

import { chatRepository } from '@/lib/infrastructure/repositories';
import { GET } from '@/app/api/chat/context/route';

function makeRequest(url = 'http://localhost/api/chat/context?chatId=abc'): NextRequest {
  return { nextUrl: { searchParams: new URL(url).searchParams } } as any;
}

describe('Chat Context API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('should_return_context_tokens', async () => {
    vi.mocked(chatRepository.getLastContextTokens).mockResolvedValue(1200);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect((await res.json()).contextTokens).toBe(1200);
    expect(chatRepository.getLastContextTokens).toHaveBeenCalledWith('user-1', 'abc');
  });

  it('should_default_chat_id_when_missing', async () => {
    vi.mocked(chatRepository.getLastContextTokens).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost/api/chat/context'));
    expect((await res.json()).contextTokens).toBe(0);
    expect(chatRepository.getLastContextTokens).toHaveBeenCalledWith('user-1', undefined);
  });

  it('should_return_zero_on_error', async () => {
    vi.mocked(chatRepository.getLastContextTokens).mockRejectedValue(new Error('db down'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect((await res.json()).contextTokens).toBe(0);
  });
});