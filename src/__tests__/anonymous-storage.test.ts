import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnonymousStorage } from '@/lib/infrastructure/storage/local-storage';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  (global as any).window = {} as Window & typeof globalThis;
  (global as any).localStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_: number) => null),
  };
  return store;
}

describe('AnonymousStorage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (global as any).window;
    delete (global as any).localStorage;
  });

  // ── SSR Guard ──

  it('should_return_empty_array_for_get_vagas_when_ssr', () => {
    expect(AnonymousStorage.getVagas()).toEqual([]);
  });

  it('should_return_empty_array_for_get_companies_when_ssr', () => {
    expect(AnonymousStorage.getCompanies()).toEqual([]);
  });

  it('should_return_null_for_run_when_ssr', () => {
    expect(AnonymousStorage.getRun()).toBeNull();
  });

  it('should_return_empty_object_for_get_stats_when_ssr', () => {
    expect(AnonymousStorage.getStats()).toEqual({});
  });

  // ── Vagas CRUD (client-side) ──

  it('should_store_and_retrieve_vagas', () => {
    mockLocalStorage();
    const vagas = [{ empresa: 'CorpA', link: 'https://a.com' }] as any;
    AnonymousStorage.setVagas(vagas);
    expect(AnonymousStorage.getVagas()).toEqual(vagas);
  });

  it('should_add_vagas_without_duplicating_by_link', () => {
    mockLocalStorage();
    AnonymousStorage.setVagas([{ empresa: 'A', link: 'https://same' } as any]);
    AnonymousStorage.addVagas([
      { empresa: 'B', link: 'https://same' } as any,
      { empresa: 'C', link: 'https://new' } as any,
    ]);
    const vagas = AnonymousStorage.getVagas();
    expect(vagas).toHaveLength(2);
    expect(vagas[0].empresa).toBe('A');
    expect(vagas[1].empresa).toBe('C');
  });

  it('should_return_empty_array_when_json_parse_fails', () => {
    const store = mockLocalStorage();
    store['ru_anon_vagas'] = 'invalid-json';
    expect(AnonymousStorage.getVagas()).toEqual([]);
  });

  // ── Companies CRUD ──

  it('should_store_and_retrieve_companies', () => {
    mockLocalStorage();
    AnonymousStorage.setCompanies(['CorpA', 'CorpB']);
    expect(AnonymousStorage.getCompanies()).toEqual(['CorpA', 'CorpB']);
  });

  // ── Run CRUD ──

  it('should_store_and_retrieve_run', () => {
    mockLocalStorage();
    const run = { id: 'run-1', status: 'running' } as any;
    AnonymousStorage.setRun(run);
    expect(AnonymousStorage.getRun()).toEqual(run);
  });

  it('should_return_null_for_missing_run', () => {
    mockLocalStorage();
    expect(AnonymousStorage.getRun()).toBeNull();
  });

  // ── Stats CRUD ──

  it('should_store_and_retrieve_stats', () => {
    mockLocalStorage();
    AnonymousStorage.setStats({ total_jobs: 10 });
    expect(AnonymousStorage.getStats()).toEqual({ total_jobs: 10 });
  });

  it('should_return_empty_object_for_missing_stats', () => {
    mockLocalStorage();
    expect(AnonymousStorage.getStats()).toEqual({});
  });

  // ── Clear ──

  it('should_clear_all_stored_data', () => {
    mockLocalStorage();
    AnonymousStorage.setVagas([{ empresa: 'A' } as any]);
    AnonymousStorage.setCompanies(['CorpA']);
    AnonymousStorage.setRun({ id: '1' } as any);
    AnonymousStorage.setStats({ total_jobs: 5 });
    AnonymousStorage.clear();
    expect(AnonymousStorage.getVagas()).toEqual([]);
    expect(AnonymousStorage.getCompanies()).toEqual([]);
    expect(AnonymousStorage.getRun()).toBeNull();
    expect(AnonymousStorage.getStats()).toEqual({});
  });

  // ── Quota Exceeded ──

  it('should_silently_handle_quota_exceeded_on_set', () => {
    mockLocalStorage();
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
    AnonymousStorage.setVagas([{ empresa: 'A' } as any]);
    expect(true).toBe(true);
  });
});
