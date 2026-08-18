import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface ToolCallCount {
  toolName: string;
  count: number;
}

/** Contagem agregada por dia (fuso America/Sao_Paulo). */
export interface DayCountRow {
  dateKey: string;
  count: number;
}

/** Tabelas/colunas suportadas pela agregação diária (allowlist — identifiers
 * de SQL não são parametrizáveis, então cada entrada mapeia para uma query
 * estática e segura). */
export type DailyCountTable = 'users_created' | 'users_login' | 'pipeline_runs';

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
  dailyCountsSince(table: DailyCountTable, since: Date): Promise<DayCountRow[]>;
  toolCallsSince(since: Date): Promise<ToolCallCount[]>;
  listUsers(): Promise<AdminUserBasic[]>;
  chatUsageByUser(): Promise<ChatUsageByUser[]>;
  pipelineRunsByUser(): Promise<UserAggregate[]>;
  jobsByUser(): Promise<UserAggregate[]>;
  courseClicksByUser(): Promise<UserAggregate[]>;
  extensionTokensByUser(): Promise<UserAggregate[]>;
}

// Agregação diária no Postgres (fuso America/Sao_Paulo). Colunas são
// TIMESTAMP(3) naive em UTC; `col AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'`
// interpreta como UTC e converte para horário local SP — equivalente ao
// toDayKey (Intl) do admin-stats. Queries estáticas (identifiers não são
// parametrizáveis) e indexadas por DailyCountTable.
const DAILY_COUNT_QUERIES: Record<DailyCountTable, (since: Date) => Promise<DayCountRow[]>> = {
  users_created: (since) => prisma.$queryRaw`
    SELECT to_char(date_trunc('day', "created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD') AS "dateKey",
           COUNT(*)::int AS "count"
    FROM "users"
    WHERE "created_at" >= ${since}
    GROUP BY 1`,
  users_login: (since) => prisma.$queryRaw`
    SELECT to_char(date_trunc('day', "last_login_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD') AS "dateKey",
           COUNT(*)::int AS "count"
    FROM "users"
    WHERE "last_login_at" >= ${since}
    GROUP BY 1`,
  pipeline_runs: (since) => prisma.$queryRaw`
    SELECT to_char(date_trunc('day', "started_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM-DD') AS "dateKey",
           COUNT(*)::int AS "count"
    FROM "pipeline_runs"
    WHERE "started_at" >= ${since}
    GROUP BY 1`,
};

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

  async dailyCountsSince(table, since) {
    return DAILY_COUNT_QUERIES[table](since);
  },

  async toolCallsSince(since) {
    const grouped = await prisma.chatToolCall.groupBy({
      by: ['toolName'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    return grouped.map((row) => ({ toolName: row.toolName, count: row._count._all }));
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