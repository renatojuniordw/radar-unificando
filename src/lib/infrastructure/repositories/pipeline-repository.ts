import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { PipelineRun } from '@prisma/client';

export interface IPipelineRunRepository {
  findById(id: string): Promise<PipelineRun | null>;
  create(data: { id: string; userId: string; status?: string; discoveryEnabled?: boolean }): Promise<PipelineRun>;
  update(id: string, data: { status?: string; totalJobs?: number; gupyJobs?: number; inhireJobs?: number; newCompaniesFound?: number; finishedAt?: Date }): Promise<PipelineRun>;
}

export const pipelineRunRepository: IPipelineRunRepository = {
  async findById(id) {
    return prisma.pipelineRun.findFirst({ where: { id } });
  },

  async create(data) {
    return prisma.pipelineRun.create({ data });
  },

  async update(id, data) {
    return prisma.pipelineRun.update({ where: { id }, data });
  },
};
