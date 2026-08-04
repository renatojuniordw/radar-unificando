import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InHireScraper } from '@/lib/core/scrapers/inhire-scraper';

const scraper = new InHireScraper();

describe('InHireScraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should_return_normalized_jobs_on_successful_fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, titulo: 'Data Analyst', empresa: 'CorpA', local: 'Remoto', dataPublicacao: '2024-01-01', url: 'https://a.com', descricao: '' }]),
    }) as any;
    const result = await scraper.searchJobs(['CorpA']);
    expect(result).toHaveLength(1);
    expect(result[0].plataforma).toBe('InHire');
    expect(result[0].empresa).toBe('CorpA');
    expect(result[0].tipo).toBe('Remoto');
  });

  it('should_return_empty_array_when_fetch_fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await scraper.searchJobs(['CorpA']);
    expect(result).toEqual([]);
  });

  it('should_return_empty_array_when_response_not_ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    const result = await scraper.searchJobs(['CorpA']);
    expect(result).toEqual([]);
  });

  it('should_handle_non_array_response_gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vagas: [{ id: 1, titulo: 'Data Analyst', empresa: 'Corp', local: '', dataPublicacao: '', url: '', descricao: '' }] }),
    }) as any;
    const result = await scraper.searchJobs();
    expect(result).toHaveLength(1);
  });

  it('should_detect_remote_from_location_field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, titulo: 'Analyst', empresa: 'Corp', local: 'Trabalho Remoto', dataPublicacao: '', url: '', descricao: '' }]),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].tipo).toBe('Remoto');
  });

  it('should_mark_non_remote_jobs_with_location_type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, titulo: 'Analyst', empresa: 'Corp', local: 'São Paulo - SP', dataPublicacao: '', url: '', descricao: '' }]),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].tipo).toBe('São Paulo - SP');
  });

  it('should_infer_role_from_title', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, titulo: 'Revenue Operations Analyst', empresa: 'Corp', local: '', dataPublicacao: '', url: '', descricao: '' },
        { id: 2, titulo: 'Data Analyst', empresa: 'Corp', local: '', dataPublicacao: '', url: '', descricao: '' },
      ]),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].cargo_categoria).toContain('Revenue');
    expect(result[1].cargo_categoria).toContain('Data Analyst');
  });

  it('should_return_empty_when_no_companies_provided_and_fetch_fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await scraper.searchJobs();
    expect(result).toEqual([]);
  });

  it('should_search_single_company_via_search_company', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, titulo: 'Analyst', empresa: 'SingleCorp', local: '', dataPublicacao: '', url: '', descricao: '' }]),
    }) as any;
    const result = await scraper.searchCompany('SingleCorp');
    expect(result).toHaveLength(1);
    expect(result[0].empresa).toBe('SingleCorp');
  });
});
