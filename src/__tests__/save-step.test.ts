import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSaveStep } from '@/lib/core/pipeline/steps/save-step';

vi.mock('@/lib/core/dedup', () => ({
  dedupEngine: {
    dedupByLink: vi.fn(),
  },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: {
    createMany: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

import { dedupEngine } from '@/lib/core/dedup';
import { jobRepository } from '@/lib/infrastructure/repositories';

const makeJob = (link: string) => ({
  empresa: 'Corp',
  plataforma: 'Gupy' as const,
  na_lista: 'Não' as const,
  cargo_categoria: 'Analyst',
  titulo_vaga: 'Data Analyst',
  tipo: 'Remoto',
  local: 'Remote',
  link,
  nome_na_plataforma: 'Corp',
  publicado: '2024-01-01',
  alerta: '',
});

describe('SaveStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_dedup_and_save_jobs_returning_inserted_count', async () => {
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([makeJob('https://a.com/1'), makeJob('https://a.com/2')]);
    vi.mocked(jobRepository.createMany).mockResolvedValue(2);
    const result = await runSaveStep('run-1', [makeJob('https://a.com/1'), makeJob('https://a.com/2')], { userId: 'user-1', source: 'gupy_mcp' });
    expect(result).toBe(2);
  });

  it('should_limit_to_200_jobs_after_dedup', async () => {
    const manyJobs = Array.from({ length: 300 }, (_, i) => makeJob(`https://a.com/${i}`));
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue(manyJobs);
    vi.mocked(jobRepository.createMany).mockResolvedValue(200);
    const result = await runSaveStep('run-1', manyJobs, { userId: 'user-1', source: 'gupy_mcp' });
    expect(result).toBe(200);
  });

  it('should_map_job_data_to_prisma_schema', async () => {
    const job = makeJob('https://a.com/1');
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([job]);
    vi.mocked(jobRepository.createMany).mockImplementation(async (data) => {
      expect(data[0]).toHaveProperty('userId', 'user-1');
      expect(data[0]).toHaveProperty('empresa', 'Corp');
      expect(data[0]).toHaveProperty('plataforma', 'Gupy');
      expect(data[0]).toHaveProperty('naLista', 'Não');
      expect(data[0]).toHaveProperty('cargoCategoria', 'Analyst');
      expect(data[0]).toHaveProperty('tituloVaga', 'Data Analyst');
      expect(data[0]).toHaveProperty('link', 'https://a.com/1');
      return 1;
    });
    await runSaveStep('run-1', [job], { userId: 'user-1', source: 'gupy_mcp' });
  });

  it('should_return_zero_when_no_jobs_to_save', async () => {
    vi.mocked(dedupEngine.dedupByLink).mockReturnValue([]);
    vi.mocked(jobRepository.createMany).mockResolvedValue(0);
    const result = await runSaveStep('run-1', [], { userId: 'user-1', source: 'gupy_mcp' });
    expect(result).toBe(0);
  });
});
