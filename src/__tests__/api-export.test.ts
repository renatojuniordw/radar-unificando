import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  jobRepository: { findByUserId: vi.fn() },
}));

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
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
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
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([{ id: '1', company: 'Corp' }] as any);
    const res = await GET(makeRequest('json'));
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].company).toBe('Corp');
  });

  it('should_escape_csv_values_with_commas', async () => {
    vi.mocked(jobRepository.findByUserId).mockResolvedValue([
      { company: 'Corp, Inc.', title: 'Data "Analyst"', roleCategory: 'Analytics', platform: 'Gupy', onList: 'Sim', type: 'Remoto', location: 'Remote', link: 'https://a.com', companyNameOnPlatform: 'Corp', postedAt: '', alert: '', detectedAt: null } as any,
    ]);
    const res = await GET(makeRequest('csv'));
    const text = await res.text();
    expect(text).toContain('"Corp, Inc."');
    expect(text).toContain('"Data ""Analyst"""');
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest('csv'));
    expect(res.status).toBe(401);
    expect(jobRepository.findByUserId).not.toHaveBeenCalled();
  });
});
