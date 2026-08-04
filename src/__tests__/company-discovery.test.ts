import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyDiscovery } from '@/lib/core/discovery/company-discovery';

const discovery = new CompanyDiscovery();

describe('CompanyDiscovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockWaybackSuccess() {
    return { ok: true, json: async () => [['key', 'url', 'ts'], ['key2', 'url2', 'ts2']] };
  }

  function mockWaybackEmpty() {
    return { ok: true, json: async () => [['single']] };
  }

  it('should_return_deduped_results_from_successful_searches', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockWaybackSuccess())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ page: { url: 'https://corp.carreiras.com.br' } }],
        }),
      });
    const result = await discovery.discover(['Corp']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].fonte).toBeDefined();
  });

  it('should_return_empty_array_when_all_searches_fail', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network fail'));
    const result = await discovery.discover(['Corp']);
    expect(result).toEqual([]);
  });

  it('should_return_only_wayback_results_when_urlscan_fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockWaybackSuccess())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockRejectedValueOnce(new Error('urlscan fail'));
    const result = await discovery.discover(['Corp']);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should_deduplicate_results_by_company_name', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockWaybackSuccess())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockResolvedValueOnce(mockWaybackEmpty())
      .mockRejectedValueOnce(new Error('urlscan ignored'));
    const result = await discovery.discover(['Corp']);
    const seenNames = new Set(result.map(r => r.nome.toLowerCase().trim()));
    expect(seenNames.size).toBe(result.length);
  });

  it('should_handle_empty_company_list', async () => {
    const result = await discovery.discover([]);
    expect(result).toEqual([]);
  });

  it('should_return_only_urlscan_results_when_wayback_fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('web.archive.org')) {
        return Promise.reject(new Error('wayback fail'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          results: [{ page: { url: 'https://corp.trabalheconosco.com.br' } }],
        }),
      }) as any;
    });
    const result = await discovery.discover(['Corp']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].fonte).toBe('urlscan');
  });
});
