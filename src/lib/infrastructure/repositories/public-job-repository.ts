import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { Job } from '@/types';

const PUBLIC_TTL_DAYS = 7;

/**
 * Pool público de vagas (deduplicado por link, com TTL) alimentado por toda
 * execução do pipeline — logada ou anônima. Alimenta as páginas estáticas de
 * SEO (/vagas e /vagas/[cargo]) sem depender de buscas de usuários logados.
 */
export const publicJobRepository = {
  async upsertMany(jobs: Job[]): Promise<number> {
    if (jobs.length === 0) return 0;

    const byLink = new Map<string, Job>();
    for (const job of jobs) {
      if (!byLink.has(job.link)) byLink.set(job.link, job);
    }
    const unique = [...byLink.values()];
    const links = unique.map((j) => j.link);
    const expiresAt = new Date(Date.now() + PUBLIC_TTL_DAYS * 86_400_000);

    const created = await prisma.publicJob.createMany({
      data: unique.map((job) => ({
        link: job.link,
        source: job.platform === 'Gupy' ? 'gupy_api' : 'inhire_api',
        company: job.company || 'Desconhecida',
        platform: job.platform,
        roleCategory: job.roleCategory,
        title: job.title,
        type: job.type,
        location: job.location,
        postedAt: job.postedAt,
        description: job.description ?? null,
        status: 'active',
        detectedAt: job.detectedAt ?? new Date().toISOString(),
        expiresAt,
      })),
      skipDuplicates: true,
    });

    // Renova o TTL das vagas já existentes no pool.
    await prisma.publicJob.updateMany({
      where: { link: { in: links }, status: 'active' },
      data: { expiresAt, lastCheckedAt: new Date() },
    });

    return created.count;
  },

  async findPublic(take = 200) {
    return prisma.publicJob.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  async findByRoleCategory(roleCategory: string, take = 100) {
    return prisma.publicJob.findMany({
      where: { status: 'active', roleCategory, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  async findRoleCategories() {
    const groups = await prisma.publicJob.groupBy({
      by: ['roleCategory'],
      where: {
        status: 'active',
        roleCategory: { not: null },
        expiresAt: { gt: new Date() },
      },
      _count: { _all: true },
      orderBy: { _count: { roleCategory: 'desc' } },
    });
    return groups
      .filter((g) => g.roleCategory && g.roleCategory.trim().length > 0)
      .map((g) => ({ roleCategory: g.roleCategory as string, count: g._count._all }));
  },
};
