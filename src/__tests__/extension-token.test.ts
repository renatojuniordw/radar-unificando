import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    extensionToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import {
  generateExtensionToken,
  hashExtensionToken,
  createExtensionToken,
  findUserIdByExtensionToken,
} from '@/lib/core/extension/extension-token';

const HEX_64 = /^[0-9a-f]{64}$/;

describe('ExtensionToken', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generateExtensionToken', () => {
    it('should_generate_64_char_hex_token', () => {
      const token = generateExtensionToken();
      expect(token).toMatch(HEX_64);
      expect(token).not.toBe(generateExtensionToken());
    });
  });

  describe('hashExtensionToken', () => {
    it('should_be_deterministic_sha256_hex', () => {
      const h1 = hashExtensionToken('abc');
      const h2 = hashExtensionToken('abc');
      expect(h1).toBe(h2);
      expect(h1).toMatch(HEX_64);
    });
  });

  describe('createExtensionToken', () => {
    it('should_store_only_the_hash_and_return_raw_token', async () => {
      vi.mocked(prisma.extensionToken.create).mockResolvedValue({} as any);

      const raw = await createExtensionToken('user-1');

      expect(raw).toMatch(HEX_64);
      expect(vi.mocked(prisma.extensionToken.create)).toHaveBeenCalledWith({
        data: { userId: 'user-1', tokenHash: hashExtensionToken(raw) },
      });
      expect(vi.mocked(prisma.extensionToken.create).mock.calls[0][0].data.tokenHash).not.toBe(raw);
    });
  });

  describe('findUserIdByExtensionToken', () => {
    it('should_return_null_when_token_not_found', async () => {
      vi.mocked(prisma.extensionToken.findFirst).mockResolvedValue(null);
      const userId = await findUserIdByExtensionToken('raw-token');
      expect(userId).toBeNull();
      expect(prisma.extensionToken.update).not.toHaveBeenCalled();
    });

    it('should_return_userId_and_touch_lastUsedAt_when_valid', async () => {
      vi.mocked(prisma.extensionToken.findFirst).mockResolvedValue({ id: 'tok-1', userId: 'user-1' } as any);
      vi.mocked(prisma.extensionToken.update).mockResolvedValue({} as any);

      const userId = await findUserIdByExtensionToken('raw-token');

      expect(userId).toBe('user-1');
      expect(prisma.extensionToken.update).toHaveBeenCalledWith({
        where: { id: 'tok-1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should_return_null_when_token_revoked', async () => {
      vi.mocked(prisma.extensionToken.findFirst).mockResolvedValue(null);
      const userId = await findUserIdByExtensionToken('revoked-token');
      expect(userId).toBeNull();
    });
  });
});