import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  newCompanyRepository: { findByUserId: vi.fn(), upsert: vi.fn(), deleteById: vi.fn() },
}));

import { auth } from '@/auth';
import { newCompanyRepository } from '@/lib/infrastructure/repositories';
import { GET, POST, DELETE } from '@/app/api/empresas/route';

function mockSession() { vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any); }
function mockNoSession() { vi.mocked(auth).mockResolvedValue(null); }

describe('Empresas API', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/empresas', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      expect((await GET()).status).toBe(401);
    });

    it('should_return_companies_when_authenticated', async () => {
      mockSession();
      vi.mocked(newCompanyRepository.findByUserId).mockResolvedValue([{ nome: 'Corp' }] as any);
      const body = await (await GET()).json();
      expect(body).toHaveLength(1);
    });
  });

  describe('POST /api/empresas', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      expect((await POST({ json: async () => ({}) } as any)).status).toBe(401);
    });

    it('should_return_400_when_nome_missing', async () => {
      mockSession();
      const res = await POST({ json: async () => ({}) } as any);
      expect(res.status).toBe(400);
    });

    it('should_upsert_company_on_valid_request', async () => {
      mockSession();
      vi.mocked(newCompanyRepository.upsert).mockResolvedValue({ nome: 'NewCo' } as any);
      const res = await POST({ json: async () => ({ nome: 'NewCo', totalVagas: 5 }) } as any);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/empresas', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      const url = new URL('http://localhost/api/empresas?id=1');
      const res = await DELETE({ url: url.toString(), nextUrl: url } as any);
      expect(res.status).toBe(401);
    });

    it('should_return_400_when_id_missing', async () => {
      mockSession();
      const url = new URL('http://localhost/api/empresas');
      const res = await DELETE({ url: url.toString(), nextUrl: url } as any);
      expect(res.status).toBe(400);
    });

    it('should_delete_company', async () => {
      mockSession();
      vi.mocked(newCompanyRepository.deleteById).mockResolvedValue();
      const url = new URL('http://localhost/api/empresas?id=company-1');
      const res = await DELETE({ url: url.toString(), nextUrl: url } as any);
      expect(res.status).toBe(200);
    });
  });
});
