import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: { findByUserId: vi.fn() },
}));

import { auth } from '@/auth';
import { jobRepository } from '@/lib/infrastructure/repositories';
import { GET } from '@/app/export/route';

function makeRequest(format?: string): any {
  const url = new URL('http://localhost/export');
  if (format) url.searchParams.set('format', format);
  return { nextUrl: url } as any;
}

describe('GET /export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_csv_with_correct_headers', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    const res = await GET(makeRequest('csv'));
    const text = await res.text();
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(text).toContain('Empresa');
    expect(text).toContain('Titulo da Vaga');
  });

  it('should_return_json_when_requested', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([{ id: '1', empresa: 'Corp' }] as any);
    const res = await GET(makeRequest('json'));
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].empresa).toBe('Corp');
  });

  it('should_escape_csv_values_with_commas', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([
      { empresa: 'Corp, Inc.', tituloVaga: 'Data "Analyst"', cargoCategoria: 'Analytics', plataforma: 'Gupy', naLista: 'Sim', tipo: 'Remoto', local: 'Remote', link: 'https://a.com', nomeNaPlataforma: 'Corp', publicado: '', alerta: '', detectadoEm: null } as any,
    ]);
    const res = await GET(makeRequest('csv'));
    const text = await res.text();
    expect(text).toContain('"Corp, Inc."');
    expect(text).toContain('"Data ""Analyst"""');
  });

  it('should_use_anonymous_user_when_not_authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([]);
    await GET(makeRequest('csv'));
    expect(jobRepository.findByUserId).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000', expect.any(Object));
  });
});
