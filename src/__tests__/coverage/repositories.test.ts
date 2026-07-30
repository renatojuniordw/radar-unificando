import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindUnique = vi.fn();
const mockAppCreate = vi.fn();
const mockLogCreate = vi.fn();
const mockAppUpdate = vi.fn();

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    profile: { findFirst: vi.fn(), upsert: vi.fn() },
    job: { findMany: vi.fn(), findUnique: vi.fn(), createMany: vi.fn() },
    application: {
      findMany: vi.fn(), findFirst: vi.fn(), create: mockAppCreate,
      findUnique: mockFindUnique, update: mockAppUpdate, deleteMany: vi.fn(),
    },
    applicationLog: { create: mockLogCreate, findMany: vi.fn() },
    newCompany: { findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    companyPresence: { findMany: vi.fn(), upsert: vi.fn() },
    pipelineRun: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

describe('ApplicationRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_create_application', async () => {
    mockAppCreate.mockResolvedValue({ id: 'app-1' });
    const { applicationRepository } = await import('@/lib/infrastructure/repositories');
    const result = await applicationRepository.create({ userId: 'u1', jobId: 'j1' });
    expect(result.id).toBe('app-1');
  });

  it('should_log_stage_change_on_update', async () => {
    mockFindUnique.mockResolvedValue({ id: 'app-1', stage: 'discovered' });
    mockLogCreate.mockResolvedValue({} as any);
    mockAppUpdate.mockResolvedValue({ id: 'app-1', stage: 'analyzed' });
    const { applicationRepository } = await import('@/lib/infrastructure/repositories');
    await applicationRepository.updateStage('app-1', 'analyzed', 'u1');
    expect(mockLogCreate).toHaveBeenCalled();
  });
});

describe('JobRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_find_by_user_id', async () => {
    const { jobRepository } = await import('@/lib/infrastructure/repositories');
    const { prisma } = await import('@/lib/infrastructure/db/prisma-client');
    vi.mocked(prisma.job.findMany).mockResolvedValue([{ id: '1' }] as any);
    const result = await jobRepository.findByUserId('user-1');
    expect(result).toHaveLength(1);
  });

  it('should_create_many', async () => {
    const { jobRepository } = await import('@/lib/infrastructure/repositories');
    const { prisma } = await import('@/lib/infrastructure/db/prisma-client');
    vi.mocked(prisma.job.createMany).mockResolvedValue({ count: 5 });
    const result = await jobRepository.createMany([{} as any]);
    expect(result).toBe(5);
  });
});

describe('UserRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_find_by_email_normalized', async () => {
    const { userRepository } = await import('@/lib/infrastructure/repositories');
    const { prisma } = await import('@/lib/infrastructure/db/prisma-client');
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: '1', email: 'test@test.com' } as any);
    const result = await userRepository.findByEmail('TEST@TEST.COM');
    expect(result?.email).toBe('test@test.com');
  });
});

describe('PipelineRunRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_create_run', async () => {
    const { pipelineRunRepository } = await import('@/lib/infrastructure/repositories');
    const { prisma } = await import('@/lib/infrastructure/db/prisma-client');
    vi.mocked(prisma.pipelineRun.create).mockResolvedValue({ id: 'run-1' } as any);
    const result = await pipelineRunRepository.create({ id: 'run-1', userId: 'u1' });
    expect(result.id).toBe('run-1');
  });
});
