import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    newCompany: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { newCompanyRepository } from '@/lib/infrastructure/repositories/new-company-repository';

const mocked = vi.mocked(prisma.newCompany);

describe('newCompanyRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('create_persiste_empresa', async () => {
    mocked.create.mockResolvedValue({ id: 'c1', name: 'Acme' } as any);
    await newCompanyRepository.create({ userId: 'u1', name: 'Acme', careersUrl: 'https://acme.gupy.io' });
    expect(mocked.create).toHaveBeenCalledWith({
      data: { userId: 'u1', name: 'Acme', careersUrl: 'https://acme.gupy.io' },
    });
  });

  it('findExisting_retorna_set_com_nomes_existentes', async () => {
    mocked.findMany.mockResolvedValue([{ name: 'Acme' }, { name: 'Globex' }] as any);
    const existing = await newCompanyRepository.findExisting('u1', ['Acme', 'Globex', 'Initech']);
    expect(existing.has('Acme')).toBe(true);
    expect(existing.has('Initech')).toBe(false);
    expect(mocked.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', name: { in: ['Acme', 'Globex', 'Initech'], mode: 'insensitive' } },
      select: { name: true },
    });
  });

  it('findExisting_retorna_vazio_sem_chamar_prisma_para_lista_vazia', async () => {
    const existing = await newCompanyRepository.findExisting('u1', []);
    expect(existing.size).toBe(0);
    expect(mocked.findMany).not.toHaveBeenCalled();
  });
});
