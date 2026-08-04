import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { Job, Prisma } from '@prisma/client';
import { buildProfileTokens, rankJobsByProfile } from '@/lib/core/matching/recommendation';

export interface IJobRepository {
  findByUserId(userId: string, opts?: { plataforma?: string; cargo?: string; search?: string; take?: number }): Promise<Job[]>;
  findRecommendedByUserId(
    userId: string,
    profile: { currentRole: string | null; area: string | null; skills: string[] },
    take?: number
  ): Promise<Array<{ job: Job; score: number }>>;
  findById(id: string): Promise<Job | null>;
  createMany(data: Prisma.JobCreateManyInput[]): Promise<number>;
  findExistingLinks(userId: string, links: string[]): Promise<Set<string>>;
  findStaleForRevalidation(limit: number): Promise<Job[]>;
  markStatus(ids: string[], status: string): Promise<void>;
  touchLastChecked(ids: string[]): Promise<void>;
}

export const jobRepository: IJobRepository = {
  async findByUserId(userId, opts = {}) {
    const where: Prisma.JobWhereInput = { userId, status: 'active' };
    if (opts.plataforma) where.plataforma = opts.plataforma;
    if (opts.cargo) where.cargoCategoria = opts.cargo;

    if (opts.search && opts.search.trim()) {
      const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'a', 'o', 'para', 'com']);
      const searchTerms = opts.search
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));

      if (searchTerms.length > 0) {
        where.AND = searchTerms.map(term => ({
          OR: [
            { empresa: { contains: term, mode: 'insensitive' } },
            { tituloVaga: { contains: term, mode: 'insensitive' } },
            { nomeNaPlataforma: { contains: term, mode: 'insensitive' } },
            { cargoCategoria: { contains: term, mode: 'insensitive' } },
          ],
        }));
      }
    }

    return prisma.job.findMany({ where, orderBy: { createdAt: 'desc' }, take: opts.take ?? 200 });
  },

  async findRecommendedByUserId(userId, profile, take = 30) {
    const tokens = buildProfileTokens(profile);
    if (tokens.length === 0) return [];

    // Busca candidatos com OR (contains insensitive)
    const candidates = await prisma.job.findMany({
      where: {
        userId,
        status: 'active',
        OR: tokens.flatMap(token => [
          { tituloVaga: { contains: token, mode: 'insensitive' } },
          { nomeNaPlataforma: { contains: token, mode: 'insensitive' } },
          { cargoCategoria: { contains: token, mode: 'insensitive' } },
          { empresa: { contains: token, mode: 'insensitive' } },
        ]),
      },
      take: 100, // Busca mais para rankear
    });

    // Rankeia via função pura
    const ranked = rankJobsByProfile(candidates, tokens);

    // Retorna top N
    return ranked.slice(0, take);
  },

  async findById(id) {
    return prisma.job.findUnique({ where: { id } });
  },

  async createMany(data) {
    const result = await prisma.job.createMany({ data, skipDuplicates: true });
    return result.count;
  },

  async findExistingLinks(userId, links) {
    if (links.length === 0) return new Set();
    const rows = await prisma.job.findMany({
      where: { userId, link: { in: links } },
      select: { link: true },
    });
    return new Set(rows.map(r => r.link));
  },

  async findStaleForRevalidation(limit) {
    return prisma.job.findMany({
      where: { status: 'active' },
      orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }],
      take: limit,
    });
  },

  async markStatus(ids, status) {
    if (ids.length === 0) return;
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { status, lastCheckedAt: new Date() } });
  },

  async touchLastChecked(ids) {
    if (ids.length === 0) return;
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { lastCheckedAt: new Date() } });
  },
};
