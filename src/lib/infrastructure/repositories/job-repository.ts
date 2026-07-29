import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { Job, Prisma } from '@prisma/client';

export interface IJobRepository {
  findByUserId(userId: string, opts?: { plataforma?: string; cargo?: string; search?: string; take?: number }): Promise<Job[]>;
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
    return prisma.job.findMany({ where, orderBy: { createdAt: 'asc' }, take: opts.take ?? 200 });
  },

  async findById(id) {
    return prisma.job.findUnique({ where: { id } });
  },

  async createMany(data) {
    const result = await prisma.job.createMany({ data, skipDuplicates: true });
    return result.count;
  },
};
