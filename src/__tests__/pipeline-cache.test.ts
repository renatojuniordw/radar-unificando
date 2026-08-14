import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineCache } from '@/lib/infrastructure/cache/pipeline-cache';
import type { Job } from '@/lib/types/job';

const mockJobs: Job[] = [
  {
    company: 'Acme',
    platform: 'Gupy',
    roleCategory: 'Design',
    title: 'UI/UX Designer',
    type: 'Efetivo',
    location: 'Remoto',
    link: 'https://acme.gupy.io/jobs/1',
    companyNameOnPlatform: 'Acme Corp',
    postedAt: '2026-08-10',
    alert: '',
  },
];

describe('PipelineCache (SWR)', () => {
  let cache: PipelineCache;

  beforeEach(() => {
    cache = new PipelineCache(1000, 5000); // 1s stale, 5s expires
  });

  it('deve retornar jobs: null e isStale: true para chaves inexistentes', () => {
    expect(cache.get(['Acme'], ['ui/ux'])).toEqual({ jobs: null, isStale: true });
  });

  it('deve armazenar e recuperar vagas do cache como isStale: false quando recente', () => {
    cache.set(['Acme'], ['ui/ux'], mockJobs);
    const result = cache.get(['Acme'], ['ui/ux']);
    expect(result).toEqual({ jobs: mockJobs, isStale: false });
  });

  it('deve normalizar maiúsculas/minúsculas e ordenação de chaves', () => {
    cache.set(['Acme', 'Beta'], ['UI/UX', 'Frontend'], mockJobs);
    const result = cache.get(['beta', 'ACME'], ['frontend', 'ui/ux']);
    expect(result.jobs).toEqual(mockJobs);
  });

  it('deve marcar como isStale: true após passar o tempo de staleMs, mas antes de expiresMs', () => {
    vi.useFakeTimers();
    cache.set(['Acme'], ['ui/ux'], mockJobs, 1000, 5000);

    expect(cache.get(['Acme'], ['ui/ux'])).toEqual({ jobs: mockJobs, isStale: false });

    vi.advanceTimersByTime(1200);

    expect(cache.get(['Acme'], ['ui/ux'])).toEqual({ jobs: mockJobs, isStale: true });

    vi.advanceTimersByTime(4000);

    expect(cache.get(['Acme'], ['ui/ux'])).toEqual({ jobs: null, isStale: true });
    vi.useRealTimers();
  });

  it('deve limpar todos os itens com o método clear', () => {
    cache.set(['Acme'], ['ui/ux'], mockJobs);
    cache.clear();
    expect(cache.get(['Acme'], ['ui/ux'])).toEqual({ jobs: null, isStale: true });
  });
});
