import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    pipelineRun: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories/pipeline-repository';

const mocked = vi.mocked(prisma.pipelineRun);

describe('pipelineRunRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findById_retorna_run_encontrado', async () => {
    mocked.findFirst.mockResolvedValue({ id: 'run-1', status: 'completed' } as any);
    const run = await pipelineRunRepository.findById('run-1');
    expect(run?.id).toBe('run-1');
    expect(mocked.findFirst).toHaveBeenCalledWith({ where: { id: 'run-1' } });
  });

  it('findById_retorna_null_quando_nao_existe', async () => {
    mocked.findFirst.mockResolvedValue(null);
    expect(await pipelineRunRepository.findById('missing')).toBeNull();
  });

  it('create_persiste_run', async () => {
    mocked.create.mockResolvedValue({ id: 'run-1', status: 'running' } as any);
    await pipelineRunRepository.create({ id: 'run-1', userId: 'user-1', status: 'running', discoveryEnabled: true });
    expect(mocked.create).toHaveBeenCalledWith({
      data: { id: 'run-1', userId: 'user-1', status: 'running', discoveryEnabled: true },
    });
  });

  it('update_parcial_atualiza_apenas_campos_enviados', async () => {
    mocked.update.mockResolvedValue({ id: 'run-1' } as any);
    await pipelineRunRepository.update('run-1', { status: 'failed' });
    expect(mocked.update).toHaveBeenCalledWith({ where: { id: 'run-1' }, data: { status: 'failed' } });
  });
});
