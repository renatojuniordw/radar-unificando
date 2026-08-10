import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisClientMock = vi.hoisted(() => ({
  status: 'ready',
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/infrastructure/redis/client', () => ({
  redisClient: redisClientMock,
}));

import { acquireChatLock, releaseChatLock } from '@/lib/infrastructure/redis/chat-lock';

describe('acquireChatLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClientMock.status = 'ready';
  });

  it('retorna_true_quando_o_lock_e_obtido', async () => {
    redisClientMock.set.mockResolvedValue('OK');

    const acquired = await acquireChatLock('user-1');

    expect(acquired).toBe(true);
    expect(redisClientMock.set).toHaveBeenCalledWith('chat_lock:user-1', '1', 'EX', 120, 'NX');
  });

  it('retorna_false_quando_ja_existe_lock', async () => {
    redisClientMock.set.mockResolvedValue(null);

    const acquired = await acquireChatLock('user-1');

    expect(acquired).toBe(false);
  });

  it('faz_fail_open_quando_redis_nao_esta_pronto', async () => {
    redisClientMock.status = 'connecting';

    const acquired = await acquireChatLock('user-1');

    expect(acquired).toBe(true);
    expect(redisClientMock.set).not.toHaveBeenCalled();
  });

  it('faz_fail_open_quando_o_redis_falha', async () => {
    redisClientMock.set.mockRejectedValue(new Error('redis down'));

    const acquired = await acquireChatLock('user-1');

    expect(acquired).toBe(true);
  });
});

describe('releaseChatLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClientMock.status = 'ready';
    redisClientMock.del.mockResolvedValue(1);
  });

  it('remove_o_lock_quando_redis_esta_pronto', async () => {
    await releaseChatLock('user-1');

    expect(redisClientMock.del).toHaveBeenCalledWith('chat_lock:user-1');
  });

  it('nao_chama_o_redis_quando_nao_esta_pronto', async () => {
    redisClientMock.status = 'end';

    await releaseChatLock('user-1');

    expect(redisClientMock.del).not.toHaveBeenCalled();
  });

  it('ignora_falha_na_remocao', async () => {
    redisClientMock.del.mockRejectedValue(new Error('redis down'));

    await expect(releaseChatLock('user-1')).resolves.toBeUndefined();
  });
});
