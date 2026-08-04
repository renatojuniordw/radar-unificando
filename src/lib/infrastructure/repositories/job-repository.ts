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
}

export const jobRepository: IJobRepository = {
  async findByUserId(userId, opts = {}) {
    const where: Prisma.JobWhereInput = { userId };
    if (opts.plataforma) where.plataforma = opts.plataforma;
    if (opts.cargo) where.cargoCategoria = opts.cargo;
    if (opts.search) {
      where.OR = [
        { empresa: { contains: opts.search, mode: 'insensitive' } },
        { tituloVaga: { contains: opts.search, mode: 'insensitive' } },
        { nomeNaPlataforma: { contains: opts.search, mode: 'insensitive' } },
      ];
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
};
