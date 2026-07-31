import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { NewCompany, CompanyPresence } from '@prisma/client';

export interface INewCompanyRepository {
  findByUserId(userId: string): Promise<NewCompany[]>;
  upsert(userId: string, data: { nome: string; totalVagas?: number; urlCarreiras?: string | null }): Promise<NewCompany>;
  deleteById(userId: string, id: string): Promise<void>;
}

export const newCompanyRepository: INewCompanyRepository = {
  async findByUserId(userId) {
    return prisma.newCompany.findMany({ where: { userId }, orderBy: { nome: 'asc' } });
  },

  async upsert(userId, data) {
    return prisma.newCompany.upsert({
      where: { id: `${userId}_${data.nome}` },
      create: { userId, ...data },
      update: data,
    });
  },

  async deleteById(userId, id) {
    await prisma.newCompany.delete({ where: { id, userId } });
  },
};

export interface ICompanyPresenceRepository {
  findByUserId(userId: string): Promise<CompanyPresence[]>;
  upsert(userId: string, data: { empresa: string; temGupy?: string; paginaGupy?: string; temInhire?: string; paginaInhire?: string; totalVagasInhire?: number }): Promise<CompanyPresence>;
}

export const companyPresenceRepository: ICompanyPresenceRepository = {
  async findByUserId(userId) {
    return prisma.companyPresence.findMany({ where: { userId }, orderBy: { empresa: 'asc' } });
  },

  async upsert(userId, data) {
    return prisma.companyPresence.upsert({
      where: { id: `${userId}_${data.empresa}` },
      create: { userId, ...data },
      update: data,
    });
  },
};
