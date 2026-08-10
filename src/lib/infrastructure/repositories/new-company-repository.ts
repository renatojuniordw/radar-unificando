import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { NewCompany } from '@prisma/client';

export interface INewCompanyRepository {
  create(data: { userId: string; name: string; careersUrl?: string }): Promise<NewCompany>;
  findExisting(userId: string, names: string[]): Promise<Set<string>>;
}

export const newCompanyRepository: INewCompanyRepository = {
  async create(data) {
    return prisma.newCompany.create({ data });
  },

  async findExisting(userId, names) {
    if (names.length === 0) return new Set<string>();
    const rows = await prisma.newCompany.findMany({
      where: { userId, name: { in: names, mode: 'insensitive' } },
      select: { name: true },
    });
    return new Set(rows.map((r) => r.name));
  },
};
