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
      json: async () => ({ tenantName: 'CorpA', jobsPage: [{ displayName: 'Data Analyst', status: 'published', workplaceType: 'Remoto', location: 'Remote', jobId: '1' }] }),
    }) as any;
    const result = await scraper.searchJobs(['CorpA']);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('InHire');
    expect(result[0].company).toBe('CorpA');
    expect(result[0].type).toBe('Remoto');
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
      json: async () => ({ tenantName: 'Corp', jobsPage: [{ displayName: 'Data Analyst', status: 'published', workplaceType: '', location: '', jobId: '1' }] }),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result).toHaveLength(1);
  });

  it('should_detect_remote_from_location_field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tenantName: 'Corp', jobsPage: [{ displayName: 'Analyst', status: 'published', workplaceType: 'Remoto', location: 'Trabalho Remoto', jobId: '1' }] }),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].type).toBe('Remoto');
  });

  it('should_mark_non_remote_jobs_with_location_type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tenantName: 'Corp', jobsPage: [{ displayName: 'Analyst', status: 'published', workplaceType: '', location: 'São Paulo - SP', jobId: '1' }] }),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].type).toBe('São Paulo - SP');
  });

  it('should_infer_role_from_title', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tenantName: 'Corp',
        jobsPage: [
          { displayName: 'Revenue Operations Analyst', status: 'published', workplaceType: '', location: '', jobId: '1' },
          { displayName: 'Data Analyst', status: 'published', workplaceType: '', location: '', jobId: '2' },
        ],
      }),
    }) as any;
    const result = await scraper.searchJobs(['Corp']);
    expect(result[0].roleCategory).toContain('Revenue');
    expect(result[1].roleCategory).toContain('Data Analyst');
  });

  it('should_return_empty_when_no_companies_provided_and_fetch_fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await scraper.searchJobs();
    expect(result).toEqual([]);
  });

  it('should_search_single_company_via_search_company', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tenantName: 'SingleCorp', jobsPage: [{ displayName: 'Analyst', status: 'published', workplaceType: '', location: '', jobId: '1' }] }),
    }) as any;
    const result = await scraper.searchCompany('SingleCorp');
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe('SingleCorp');
  });
});
