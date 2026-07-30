import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: { findByUserId: vi.fn() },
}));

import { auth } from '@/auth';
import { jobRepository } from '@/lib/infrastructure/repositories';
import { GET } from '@/app/api/vagas/route';

function makeRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/vagas');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString(), nextUrl: url } as any;
}

describe('GET /api/vagas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_mapped_jobs', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([
      { id: '1', empresa: 'CorpA', plataforma: 'Gupy', tituloVaga: 'Analyst', cargoCategoria: 'Analytics', tipo: 'Remoto', local: 'Remote', link: 'https://a.com', nomeNaPlataforma: 'corp', publicado: '', naLista: 'Sim', alerta: '', detectadoEm: null } as any,
    ]);
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].empresa).toBe('CorpA');
    expect(body[0].cargo_categoria).toBe('Analytics');
  });

  it('should_pass_filters_to_repository', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    await GET(makeRequest({ plataforma: 'Gupy', cargo: 'Analytics', search: 'test' }));
    expect(jobRepository.findByUserId).toHaveBeenCalledWith('user-1', {
      plataforma: 'Gupy',
      cargo: 'Analytics',
      search: 'test',
    });
  });

  it('should_return_anonymous_user_id_when_not_authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    await GET(makeRequest());
    expect(jobRepository.findByUserId).toHaveBeenCalledWith('anonymous', expect.any(Object));
  });

  it('should_return_500_on_error', async () => {
    vi.mocked(jobRepository.findByUserId).mockRejectedValue(new Error('DB error'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
