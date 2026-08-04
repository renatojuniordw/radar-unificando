import { describe, it, expect } from 'vitest';
import { DedupEngine } from '@/lib/core/dedup';
import type { JobData } from '@/types';

const engine = new DedupEngine();

function makeJob(partial: Partial<JobData>): JobData {
  return {
    empresa: 'TestCorp',
    plataforma: 'Gupy',
    na_lista: 'Não',
    cargo_categoria: 'Analyst',
    titulo_vaga: 'Data Analyst',
    tipo: 'Remoto',
    local: 'Remote',
    link: 'https://example.com/job/1',
    nome_na_plataforma: 'testcorp',
    publicado: '2024-01-01',
    alerta: '',
    ...partial,
  };
}

describe('DedupEngine', () => {
  // ── dedupByLink ──

  it('should_deduplicate_by_link_keeping_first_occurrence', () => {
    const jobs = [
      makeJob({ link: 'https://example.com/job/1', empresa: 'First' }),
      makeJob({ link: 'https://example.com/job/2', empresa: 'Second' }),
      makeJob({ link: 'https://example.com/job/1', empresa: 'Duplicate' }),
    ];
    const result = engine.dedupByLink(jobs);
    expect(result).toHaveLength(2);
    expect(result[0].empresa).toBe('First');
  });

  it('should_use_empresa_titulo_fallback_when_link_is_empty', () => {
    const jobs = [
      makeJob({ link: '', empresa: 'CorpA', titulo_vaga: 'Data Analyst' }),
      makeJob({ link: '', empresa: 'CorpA', titulo_vaga: 'Data Analyst' }),
      makeJob({ link: '', empresa: 'CorpB', titulo_vaga: 'Data Analyst' }),
    ];
    const result = engine.dedupByLink(jobs);
    expect(result).toHaveLength(2);
  });

  it('should_return_empty_array_for_empty_input', () => {
    expect(engine.dedupByLink([])).toEqual([]);
  });

  it('should_keep_all_when_no_duplicates', () => {
    const jobs = [
      makeJob({ link: 'https://a.com/1' }),
      makeJob({ link: 'https://a.com/2' }),
      makeJob({ link: 'https://a.com/3' }),
    ];
    expect(engine.dedupByLink(jobs)).toHaveLength(3);
  });

  it('should_handle_undefined_or_null_links_gracefully', () => {
    const jobs = [
      makeJob({ link: undefined as any }),
      makeJob({ link: undefined as any }),
    ];
    const result = engine.dedupByLink(jobs);
    expect(result).toHaveLength(1);
  });

  // ── dedupByTitleAndCompany ──

  it('should_deduplicate_by_company_and_title_case_insensitively', () => {
    const jobs = [
      makeJob({ empresa: 'CorpA', titulo_vaga: 'Data Analyst', link: '1' }),
      makeJob({ empresa: 'corpa', titulo_vaga: 'data analyst', link: '2' }),
      makeJob({ empresa: 'CorpA', titulo_vaga: 'Data Engineer', link: '3' }),
    ];
    const result = engine.dedupByTitleAndCompany(jobs);
    expect(result).toHaveLength(2);
  });

  it('should_deduplicate_by_title_and_company_with_whitespace', () => {
    const jobs = [
      makeJob({ empresa: '  CorpA  ', titulo_vaga: '  Data Analyst  ' }),
      makeJob({ empresa: 'CorpA', titulo_vaga: 'Data Analyst' }),
    ];
    const result = engine.dedupByTitleAndCompany(jobs);
    expect(result).toHaveLength(1);
  });

  it('should_return_empty_array_for_empty_input_in_title_dedup', () => {
    expect(engine.dedupByTitleAndCompany([])).toEqual([]);
  });

  // ── mergeSources ──

  it('should_merge_incoming_into_existing_skipping_duplicate_links', () => {
    const existing = [
      makeJob({ link: 'https://a.com/1', empresa: 'Existing' }),
      makeJob({ link: 'https://a.com/2', empresa: 'Existing' }),
    ];
    const incoming = [
      makeJob({ link: 'https://a.com/2', empresa: 'Duplicate' }),
      makeJob({ link: 'https://a.com/3', empresa: 'New' }),
    ];
    const result = engine.mergeSources(existing, incoming);
    expect(result).toHaveLength(3);
    expect(result[1].empresa).toBe('Existing');
  });

  it('should_merge_all_when_no_overlap', () => {
    const existing = [makeJob({ link: 'https://a.com/1' })];
    const incoming = [makeJob({ link: 'https://a.com/2' })];
    expect(engine.mergeSources(existing, incoming)).toHaveLength(2);
  });

  it('should_keep_existing_order_then_append_new', () => {
    const existing = [makeJob({ link: 'https://a.com/1', empresa: 'First' })];
    const incoming = [makeJob({ link: 'https://a.com/2', empresa: 'Second' })];
    const result = engine.mergeSources(existing, incoming);
    expect(result[0].empresa).toBe('First');
    expect(result[1].empresa).toBe('Second');
  });

  it('should_return_existing_when_incoming_is_empty', () => {
    const existing = [makeJob({ link: 'https://a.com/1' })];
    expect(engine.mergeSources(existing, [])).toHaveLength(1);
  });
});
