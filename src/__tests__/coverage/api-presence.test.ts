import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  companyPresenceRepository: { findByUserId: vi.fn(), upsert: vi.fn() },
}));

import { auth } from '@/auth';
import { companyPresenceRepository } from '@/lib/infrastructure/repositories';
import { GET, POST } from '@/app/api/presence/route';

describe('Presence API', () => {
  beforeEach(() => vi.clearAllMocks());

  function mockSession() { vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any); }

  describe('GET', () => {
    it('should_return_401_when_not_authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      expect((await GET()).status).toBe(401);
    });

    it('should_return_presences', async () => {
      mockSession();
      vi.mocked(companyPresenceRepository.findByUserId).mockResolvedValue([{ empresa: 'CorpA' }] as any);
      const body = await (await GET()).json();
      expect(body).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('should_return_401_when_not_authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      expect((await POST({ json: async () => ({}) } as any)).status).toBe(401);
    });

    it('should_return_400_when_empresa_missing', async () => {
      mockSession();
      const res = await POST({ json: async () => ({}) } as any);
      expect(res.status).toBe(400);
    });

    it('should_upsert_presence', async () => {
      mockSession();
      vi.mocked(companyPresenceRepository.upsert).mockResolvedValue({ empresa: 'CorpA' } as any);
      const res = await POST({ json: async () => ({ empresa: 'CorpA', temGupy: 'Sim' }) } as any);
      expect(res.status).toBe(200);
    });
  });
});
