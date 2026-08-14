import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    publicJob: { createMany: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { publicJobRepository } from '@/lib/infrastructure/repositories/public-job-repository';

const pub = vi.mocked(prisma.publicJob);

function makeJob(partial: Record<string, unknown> = {}) {
  return {
    company: 'Acme',
    platform: 'Gupy',
    roleCategory: 'Dev',
    title: 'Dev',
    link: 'https://a.com/1',
    description: 'desc',
    ...partial,
  } as any;
}

describe('publicJobRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upsertMany_retorna_zero_para_lista_vazia', async () => {
    expect(await publicJobRepository.upsertMany([])).toBe(0);
    expect(pub.createMany).not.toHaveBeenCalled();
  });

  it('upsertMany_deduplica_por_link_e_renova_ttl', async () => {
    pub.createMany.mockResolvedValue({ count: 2 } as any);
    pub.updateMany.mockResolvedValue({ count: 1 } as any);
    const count = await publicJobRepository.upsertMany([
      makeJob({ link: 'https://a.com/1' }),
      makeJob({ link: 'https://a.com/1' }),
      makeJob({ link: 'https://a.com/2', company: '' }),
    ]);
    expect(count).toBe(2);
    const createData = vi.mocked(pub.createMany).mock.calls[0]![0]!.data as Array<Record<string, unknown>>;
    expect(createData).toHaveLength(2);
    expect(createData[1].company).toBe('Desconhecida');
    expect(pub.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { expiresAt: expect.any(Date), lastCheckedAt: expect.any(Date) } }));
  });

  it('findPublic_busca_ativas_nao_expiradas', async () => {
    pub.findMany.mockResolvedValue([] as any);
    await publicJobRepository.findPublic(50);
    expect(pub.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it('findByRoleCategory_filtra_por_categoria', async () => {
    pub.findMany.mockResolvedValue([] as any);
    await publicJobRepository.findByRoleCategory('Dev', 10);
    expect(pub.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ roleCategory: 'Dev' }) }),
    );
  });

  it('findRoleCategories_filtra_categorias_vazias', async () => {
    pub.groupBy.mockResolvedValue([
      { roleCategory: 'Dev', _count: { _all: 3 } },
      { roleCategory: '   ', _count: { _all: 1 } },
      { roleCategory: null, _count: { _all: 1 } },
    ] as any);
    const result = await publicJobRepository.findRoleCategories();
    expect(result).toEqual([{ roleCategory: 'Dev', count: 3 }]);
  });
});
