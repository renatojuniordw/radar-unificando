import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { Application, ApplicationLog } from '@prisma/client';
import type { Stage } from '@/lib/core/application/state-machine';

export interface IApplicationRepository {
  findByUserId(userId: string): Promise<Application[]>;
  findByIdAndUser(id: string, userId: string): Promise<Application | null>;
  findByUserAndJob(userId: string, jobId: string): Promise<Application | null>;
  create(data: { userId: string; jobId: string; stage?: string }): Promise<Application>;
  updateStage(id: string, stage: string, userId?: string): Promise<Application>;
  deleteByIdAndUser(id: string, userId: string): Promise<void>;
  getLogs(applicationId: string): Promise<ApplicationLog[]>;
}

export const applicationRepository: IApplicationRepository = {
  async findByUserId(userId) {
    return prisma.application.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  },

  async findByIdAndUser(id, userId) {
    return prisma.application.findFirst({ where: { id, userId } });
  },

  async findByUserAndJob(userId, jobId) {
    return prisma.application.findFirst({ where: { userId, jobId } });
  },

  async create(data) {
    return prisma.application.create({ data });
  },

  async updateStage(id, stage, userId) {
    const app = await prisma.application.findUnique({ where: { id } });
    if (app && userId && stage !== app.stage) {
      await prisma.applicationLog.create({
        data: {
          applicationId: id,
          userId,
          fromStage: app.stage,
          toStage: stage,
        },
      });
    }
    return prisma.application.update({ where: { id }, data: { stage } });
  },

  async deleteByIdAndUser(id, userId) {
    await prisma.application.deleteMany({ where: { id, userId } });
  },

  async getLogs(applicationId) {
    return prisma.applicationLog.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
