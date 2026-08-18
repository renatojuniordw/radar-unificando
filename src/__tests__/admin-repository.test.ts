import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    pipelineRun: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    chatMessage: { count: vi.fn() },
    chatUsage: { aggregate: vi.fn(), groupBy: vi.fn() },
    courseClick: { count: vi.fn(), groupBy: vi.fn() },
    extensionToken: { count: vi.fn(), groupBy: vi.fn() },
    job: { groupBy: vi.fn() },
    chatToolCall: { groupBy: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { adminRepository } from '@/lib/infrastructure/repositories/admin-repository';

const user = vi.mocked(prisma.user);
const pipelineRun = vi.mocked(prisma.pipelineRun);
const chatMessage = vi.mocked(prisma.chatMessage);
const chatUsage = vi.mocked(prisma.chatUsage);
const courseClick = vi.mocked(prisma.courseClick);
const chatToolCall = vi.mocked(prisma.chatToolCall);
const extensionToken = vi.mocked(prisma.extensionToken);
const job = vi.mocked(prisma.job);

describe('adminRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('countUsers_conta_todos', async () => {
    user.count.mockResolvedValue(5);
    expect(await adminRepository.countUsers()).toBe(5);
  });

  it('countUsersSince_filtra_por_createdAt', async () => {
    const since = new Date();
    user.count.mockResolvedValue(2);
    await adminRepository.countUsersSince(since);
    expect(user.count).toHaveBeenCalledWith({ where: { createdAt: { gte: since } } });
  });

  it('countLoginsSince_filtra_por_lastLoginAt', async () => {
    const since = new Date();
    user.count.mockResolvedValue(1);
    await adminRepository.countLoginsSince(since);
    expect(user.count).toHaveBeenCalledWith({ where: { lastLoginAt: { gte: since } } });
  });

  it('countSearchesSince_filtra_por_startedAt', async () => {
    const since = new Date();
    pipelineRun.count.mockResolvedValue(3);
    await adminRepository.countSearchesSince(since);
    expect(pipelineRun.count).toHaveBeenCalledWith({ where: { startedAt: { gte: since } } });
  });

  it('countFailedSearchesSince_filtra_por_status_failed', async () => {
    const since = new Date();
    pipelineRun.count.mockResolvedValue(1);
    await adminRepository.countFailedSearchesSince(since);
    expect(pipelineRun.count).toHaveBeenCalledWith({
      where: { startedAt: { gte: since }, status: 'failed' },
    });
  });

  it('countAnonymousSearchesSince_filtra_por_userId_null', async () => {
    const since = new Date();
    pipelineRun.count.mockResolvedValue(2);
    await adminRepository.countAnonymousSearchesSince(since);
    expect(pipelineRun.count).toHaveBeenCalledWith({
      where: { startedAt: { gte: since }, userId: null },
    });
  });

  it('sumJobsFoundSince_soma_totalJobs', async () => {
    pipelineRun.aggregate.mockResolvedValue({ _sum: { totalJobs: 42 } } as any);
    expect(await adminRepository.sumJobsFoundSince(new Date())).toBe(42);
  });

  it('sumJobsFoundSince_trata_null_como_zero', async () => {
    pipelineRun.aggregate.mockResolvedValue({ _sum: { totalJobs: null } } as any);
    expect(await adminRepository.sumJobsFoundSince(new Date())).toBe(0);
  });

  it('countChatMessagesSince_conta_mensagens_de_usuario', async () => {
    const since = new Date();
    chatMessage.count.mockResolvedValue(4);
    await adminRepository.countChatMessagesSince(since);
    expect(chatMessage.count).toHaveBeenCalledWith({
      where: { role: 'user', createdAt: { gte: since } },
    });
  });

  it('sumTokensSince_soma_totalTokens', async () => {
    chatUsage.aggregate.mockResolvedValue({ _sum: { totalTokens: 900 } } as any);
    expect(await adminRepository.sumTokensSince(new Date())).toBe(900);
  });

  it('countCourseClicksSince_filtra_por_createdAt', async () => {
    const since = new Date();
    courseClick.count.mockResolvedValue(2);
    await adminRepository.countCourseClicksSince(since);
    expect(courseClick.count).toHaveBeenCalledWith({ where: { createdAt: { gte: since } } });
  });

  it('countExtensionTokens_ignora_revogados', async () => {
    extensionToken.count.mockResolvedValue(3);
    await adminRepository.countExtensionTokens();
    expect(extensionToken.count).toHaveBeenCalledWith({ where: { revokedAt: null } });
  });

  it('toolCallsSince_mapeia_groupBy', async () => {
    chatToolCall.groupBy.mockResolvedValue([
      { toolName: 'search_jobs', _count: { _all: 3 } },
      { toolName: 'analyze_ats_score', _count: { _all: 1 } },
    ] as any);
    const result = await adminRepository.toolCallsSince(new Date());
    expect(result).toEqual([
      { toolName: 'search_jobs', count: 3 },
      { toolName: 'analyze_ats_score', count: 1 },
    ]);
  });

  it('searchLogSince_cast_json_arrays', async () => {
    pipelineRun.findMany.mockResolvedValue([
      { queries: ['A'], companies: ['B'] },
      { queries: null, companies: null },
    ] as any);
    const result = await adminRepository.searchLogSince(new Date());
    expect(result).toEqual([
      { queries: ['A'], companies: ['B'] },
      { queries: null, companies: null },
    ]);
  });

  it('listUsers_ordena_por_createdAt_desc', async () => {
    user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@b.com' }] as any);
    await adminRepository.listUsers();
    expect(user.findMany).toHaveBeenCalledWith({
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
  });

  it('chatUsageByUser_mapeia_soma_e_contagem', async () => {
    chatUsage.groupBy.mockResolvedValue([
      { userId: 'u1', _sum: { totalTokens: 100 }, _count: { _all: 3 } },
      { userId: 'u2', _sum: { totalTokens: null }, _count: { _all: 1 } },
    ] as any);
    const result = await adminRepository.chatUsageByUser();
    expect(result).toEqual([
      { userId: 'u1', tokens: 100, messages: 3 },
      { userId: 'u2', tokens: 0, messages: 1 },
    ]);
  });

  it('pipelineRunsByUser_exclui_anonimos', async () => {
    pipelineRun.groupBy.mockResolvedValue([{ userId: 'u1', _count: { _all: 5 } }] as any);
    const result = await adminRepository.pipelineRunsByUser();
    expect(pipelineRun.groupBy).toHaveBeenCalledWith({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { _all: true },
    });
    expect(result).toEqual([{ userId: 'u1', count: 5 }]);
  });

  it('jobsByUser_conta_vagas_salvas', async () => {
    job.groupBy.mockResolvedValue([{ userId: 'u1', _count: { _all: 7 } }] as any);
    const result = await adminRepository.jobsByUser();
    expect(result).toEqual([{ userId: 'u1', count: 7 }]);
  });

  it('courseClicksByUser_exclui_anonimos', async () => {
    courseClick.groupBy.mockResolvedValue([{ userId: 'u1', _count: { _all: 2 } }] as any);
    const result = await adminRepository.courseClicksByUser();
    expect(result).toEqual([{ userId: 'u1', count: 2 }]);
  });

  it('extensionTokensByUser_conta_tokens', async () => {
    extensionToken.groupBy.mockResolvedValue([{ userId: 'u1', _count: { _all: 4 } }] as any);
    const result = await adminRepository.extensionTokensByUser();
    expect(result).toEqual([{ userId: 'u1', count: 4 }]);
  });
});