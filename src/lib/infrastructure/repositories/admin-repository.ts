import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface ToolCallCount {
  toolName: string;
  count: number;
}

export interface SearchLogRow {
  queries: string[] | null;
  companies: string[] | null;
}

export interface AdminUserBasic {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface UserAggregate {
  userId: string;
  count: number;
}

export interface ChatUsageByUser {
  userId: string;
  tokens: number;
  messages: number;
}

export interface IAdminRepository {
  countUsers(): Promise<number>;
  countUsersSince(since: Date): Promise<number>;
  countLoginsSince(since: Date): Promise<number>;
  countSearchesSince(since: Date): Promise<number>;
  countFailedSearchesSince(since: Date): Promise<number>;
  countAnonymousSearchesSince(since: Date): Promise<number>;
  sumJobsFoundSince(since: Date): Promise<number>;
  countChatMessagesSince(since: Date): Promise<number>;
  sumTokensSince(since: Date): Promise<number>;
  countCourseClicksSince(since: Date): Promise<number>;
  countExtensionTokens(): Promise<number>;
  usersSince(since: Date): Promise<{ createdAt: Date }[]>;
  loginsSince(since: Date): Promise<{ lastLoginAt: Date | null }[]>;
  searchesSince(since: Date): Promise<{ startedAt: Date | null }[]>;
  toolCallsSince(since: Date): Promise<ToolCallCount[]>;
  searchLogSince(since: Date): Promise<SearchLogRow[]>;
  listUsers(): Promise<AdminUserBasic[]>;
  chatUsageByUser(): Promise<ChatUsageByUser[]>;
  pipelineRunsByUser(): Promise<UserAggregate[]>;
  jobsByUser(): Promise<UserAggregate[]>;
  courseClicksByUser(): Promise<UserAggregate[]>;
  extensionTokensByUser(): Promise<UserAggregate[]>;
}

export const adminRepository: IAdminRepository = {
  async countUsers() {
    return prisma.user.count();
  },

  async countUsersSince(since) {
    return prisma.user.count({ where: { createdAt: { gte: since } } });
  },

  async countLoginsSince(since) {
    return prisma.user.count({ where: { lastLoginAt: { gte: since } } });
  },

  async countSearchesSince(since) {
    return prisma.pipelineRun.count({ where: { startedAt: { gte: since } } });
  },

  async countFailedSearchesSince(since) {
    return prisma.pipelineRun.count({
      where: { startedAt: { gte: since }, status: 'failed' },
    });
  },

  async countAnonymousSearchesSince(since) {
    return prisma.pipelineRun.count({ where: { startedAt: { gte: since }, userId: null } });
  },

  async sumJobsFoundSince(since) {
    const agg = await prisma.pipelineRun.aggregate({
      where: { startedAt: { gte: since } },
      _sum: { totalJobs: true },
    });
    return agg._sum.totalJobs ?? 0;
  },

  async countChatMessagesSince(since) {
    return prisma.chatMessage.count({
      where: { role: 'user', createdAt: { gte: since } },
    });
  },

  async sumTokensSince(since) {
    const agg = await prisma.chatUsage.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true },
    });
    return agg._sum.totalTokens ?? 0;
  },

  async countCourseClicksSince(since) {
    return prisma.courseClick.count({ where: { createdAt: { gte: since } } });
  },

  async countExtensionTokens() {
    return prisma.extensionToken.count({ where: { revokedAt: null } });
  },

  async usersSince(since) {
    return prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
  },

  async loginsSince(since) {
    return prisma.user.findMany({
      where: { lastLoginAt: { gte: since } },
      select: { lastLoginAt: true },
    });
  },

  async searchesSince(since) {
    return prisma.pipelineRun.findMany({
      where: { startedAt: { gte: since } },
      select: { startedAt: true },
    });
  },

  async toolCallsSince(since) {
    const grouped = await prisma.chatToolCall.groupBy({
      by: ['toolName'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    return grouped.map((row) => ({ toolName: row.toolName, count: row._count._all }));
  },

  async searchLogSince(since) {
    const rows = await prisma.pipelineRun.findMany({
      where: { startedAt: { gte: since } },
      select: { queries: true, companies: true },
    });
    return rows.map((row) => ({
      queries: (row.queries as string[] | null) ?? null,
      companies: (row.companies as string[] | null) ?? null,
    }));
  },

  async listUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  },

  async chatUsageByUser() {
    const rows = await prisma.chatUsage.groupBy({
      by: ['userId'],
      _sum: { totalTokens: true },
      _count: { _all: true },
    });
    return rows.map((r) => ({
      userId: r.userId,
      tokens: r._sum.totalTokens ?? 0,
      messages: r._count._all,
    }));
  },

  async pipelineRunsByUser() {
    const rows = await prisma.pipelineRun.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ userId: r.userId as string, count: r._count._all }));
  },

  async jobsByUser() {
    const rows = await prisma.job.groupBy({ by: ['userId'], _count: { _all: true } });
    return rows.map((r) => ({ userId: r.userId, count: r._count._all }));
  },

  async courseClicksByUser() {
    const rows = await prisma.courseClick.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ userId: r.userId as string, count: r._count._all }));
  },

  async extensionTokensByUser() {
    const rows = await prisma.extensionToken.groupBy({ by: ['userId'], _count: { _all: true } });
    return rows.map((r) => ({ userId: r.userId, count: r._count._all }));
  },
};