import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    generatedContentCache: { deleteMany: vi.fn() },
    chat: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { runRetentionCleanup } from '@/lib/infrastructure/cleanup/retention-cleanup';

describe('runRetentionCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.generatedContentCache.deleteMany).mockResolvedValue({ count: 3 } as any);
    vi.mocked(prisma.chat.findMany).mockResolvedValue([]);
  });

  it('should_delete_expired_cache_and_return_counts', async () => {
    vi.mocked(prisma.chat.findMany).mockResolvedValue([{ id: 'chat-1' }, { id: 'chat-2' }] as any);
    vi.mocked(prisma.chat.deleteMany).mockResolvedValue({ count: 2 } as any);

    const result = await runRetentionCleanup();
    expect(result).toEqual({ deletedExpiredCache: 3, deletedInactiveChats: 2 });
    expect(prisma.generatedContentCache.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
    expect(prisma.chat.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['chat-1', 'chat-2'] } },
    });
  });

  it('should_skip_chat_deletion_when_no_inactive_chats', async () => {
    const result = await runRetentionCleanup();
    expect(result.deletedInactiveChats).toBe(0);
    expect(prisma.chat.deleteMany).not.toHaveBeenCalled();
  });

  it('should_use_12_months_default_when_env_invalid', async () => {
    vi.stubEnv('RETENTION_INACTIVE_CHAT_MONTHS', 'abc');
    vi.resetModules();
    const { runRetentionCleanup: rerun } = await import('@/lib/infrastructure/cleanup/retention-cleanup');
    await rerun();
    vi.unstubAllEnvs();
    const findManyCall = vi.mocked(prisma.chat.findMany).mock.calls[0];
    const where = findManyCall![0]!.where as { updatedAt: { lt: Date } };
    const months = (Date.now() - where.updatedAt.lt.getTime()) / (30 * 24 * 60 * 60 * 1000);
    expect(months).toBeCloseTo(12, 0);
  });
});