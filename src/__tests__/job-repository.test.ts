import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    job: { findMany: vi.fn(), findUnique: vi.fn(), createMany: vi.fn(), updateMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { jobRepository } from '@/lib/infrastructure/repositories/job-repository';

const job = vi.mocked(prisma.job);
const jobRow = { id: 'j1', userId: 'u1', company: 'Acme', title: 'Dev', link: 'https://a.com/1' };

describe('jobRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findByUserId_aplica_filtros_de_plataforma_e_cargo', async () => {
    job.findMany.mockResolvedValue([jobRow] as any);
    await jobRepository.findByUserId('u1', { platform: 'Gupy', role: 'Dev' });
    const where = vi.mocked(job.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ userId: 'u1', status: 'active', platform: 'Gupy', roleCategory: 'Dev' });
  });

  it('findByUserId_busca_por_termos_sem_stopwords', async () => {
    job.findMany.mockResolvedValue([] as any);
    await jobRepository.findByUserId('u1', { search: 'Dev de São Paulo' });
    const where = vi.mocked(job.findMany).mock.calls[0][0]?.where as { AND: unknown[] };
    expect(where.AND).toBeDefined();
    expect((where.AND as unknown[]).length).toBe(3); // 'Dev', 'São', 'Paulo' após remover 'de'
  });

  it('findByUserId_ignora_busca_composta_so_de_stopwords', async () => {
    job.findMany.mockResolvedValue([] as any);
    await jobRepository.findByUserId('u1', { search: 'de e o' });
    const where = vi.mocked(job.findMany).mock.calls[0][0]?.where as { AND?: unknown };
    expect(where.AND).toBeUndefined();
  });

  it('findRecommendedByUserId_retorna_vazio_sem_tokens', async () => {
    const result = await jobRepository.findRecommendedByUserId('u1', { currentRole: null, area: null, skills: [] }, 10);
    expect(result).toEqual([]);
    expect(job.findMany).not.toHaveBeenCalled();
  });

  it('findRecommendedByUserId_busca_e_rankeia_candidatos', async () => {
    job.findMany.mockResolvedValue([
      { ...jobRow, title: 'Dev React', roleCategory: 'Frontend' },
      { ...jobRow, id: 'j2', title: 'Analista RH', roleCategory: 'RH' },
    ] as any);
    const result = await jobRepository.findRecommendedByUserId(
      'u1',
      { currentRole: 'Dev', area: 'Tech', skills: ['react'] },
      10,
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].job.title).toBe('Dev React');
  });

  it('findById_retorna_vaga_ou_null', async () => {
    job.findUnique.mockResolvedValue(jobRow as any);
    expect((await jobRepository.findById('j1'))?.id).toBe('j1');
    job.findUnique.mockResolvedValue(null);
    expect(await jobRepository.findById('x')).toBeNull();
  });

  it('createMany_retorna_contagem_com_skip_duplicates', async () => {
    job.createMany.mockResolvedValue({ count: 2 } as any);
    const count = await jobRepository.createMany([{ userId: 'u1', link: 'x' } as any]);
    expect(count).toBe(2);
    expect(job.createMany).toHaveBeenCalledWith({ data: expect.any(Array), skipDuplicates: true });
  });

  it('findExistingLinks_retorna_set_e_vazio_para_lista_vazia', async () => {
    job.findMany.mockResolvedValue([{ link: 'https://a.com/1' }] as any);
    const set = await jobRepository.findExistingLinks('u1', ['https://a.com/1', 'https://b.com/2']);
    expect(set.has('https://a.com/1')).toBe(true);
    expect(set.has('https://b.com/2')).toBe(false);
    expect(await jobRepository.findExistingLinks('u1', [])).toEqual(new Set());
    expect(job.findMany).toHaveBeenCalledTimes(1);
  });

  it('findStaleForRevalidation_prioriza_sem_last_checked', async () => {
    job.findMany.mockResolvedValue([jobRow] as any);
    await jobRepository.findStaleForRevalidation(50);
    expect(job.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it('markStatus_e_touchLastChecked_nao_chamam_prisma_para_listas_vazias', async () => {
    await jobRepository.markStatus([], 'inactive');
    await jobRepository.touchLastChecked([]);
    expect(job.updateMany).not.toHaveBeenCalled();
  });

  it('markStatus_atualiza_status_e_last_checked', async () => {
    job.updateMany.mockResolvedValue({ count: 1 } as any);
    await jobRepository.markStatus(['j1'], 'inactive');
    expect(job.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'inactive', lastCheckedAt: expect.any(Date) } }));
  });
});
