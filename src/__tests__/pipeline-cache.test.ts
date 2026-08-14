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

describe('PipelineCache', () => {
  let cache: PipelineCache;

  beforeEach(() => {
    cache = new PipelineCache(1000); // 1s TTL
  });

  it('deve retornar null para chaves inexistentes', () => {
    expect(cache.get(['Acme'], ['ui/ux'])).toBeNull();
  });

  it('deve armazenar e recuperar vagas do cache', () => {
    cache.set(['Acme'], ['ui/ux'], mockJobs);
    const result = cache.get(['Acme'], ['ui/ux']);
    expect(result).toEqual(mockJobs);
  });

  it('deve normalizar maiúsculas/minúsculas e ordenação de chaves', () => {
    cache.set(['Acme', 'Beta'], ['UI/UX', 'Frontend'], mockJobs);
    const result = cache.get(['beta', 'ACME'], ['frontend', 'ui/ux']);
    expect(result).toEqual(mockJobs);
  });

  it('deve expirar os itens após o tempo de TTL', async () => {
    vi.useFakeTimers();
    cache.set(['Acme'], ['ui/ux'], mockJobs, 500);

    expect(cache.get(['Acme'], ['ui/ux'])).toEqual(mockJobs);

    vi.advanceTimersByTime(600);

    expect(cache.get(['Acme'], ['ui/ux'])).toBeNull();
    vi.useRealTimers();
  });

  it('deve limpar todos os itens com o método clear', () => {
    cache.set(['Acme'], ['ui/ux'], mockJobs);
    cache.clear();
    expect(cache.get(['Acme'], ['ui/ux'])).toBeNull();
  });
});
