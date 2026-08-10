import { describe, it, expect } from 'vitest';
import { DedupEngine } from '@/lib/core/dedup';
import type { Job } from '@/types';

const engine = new DedupEngine();

function makeJob(partial: Partial<Job>): Job {
  return {
    company: 'TestCorp',
    platform: 'Gupy',
    onList: 'Não',
    roleCategory: 'Analyst',
    title: 'Data Analyst',
    type: 'Remoto',
    location: 'Remote',
    link: 'https://example.com/job/1',
    companyNameOnPlatform: 'testcorp',
    postedAt: '2024-01-01',
    alert: '',
    ...partial,
  };
}

describe('DedupEngine', () => {
  // ── dedupByLink ──

  it('should_deduplicate_by_link_keeping_first_occurrence', () => {
    const jobs = [
      makeJob({ link: 'https://example.com/job/1', company: 'First' }),
      makeJob({ link: 'https://example.com/job/2', company: 'Second' }),
      makeJob({ link: 'https://example.com/job/1', company: 'Duplicate' }),
    ];
    const result = engine.dedupByLink(jobs);
    expect(result).toHaveLength(2);
    expect(result[0].company).toBe('First');
  });

  it('should_use_company_title_fallback_when_link_is_empty', () => {
    const jobs = [
      makeJob({ link: '', company: 'CorpA', title: 'Data Analyst' }),
      makeJob({ link: '', company: 'CorpA', title: 'Data Analyst' }),
      makeJob({ link: '', company: 'CorpB', title: 'Data Analyst' }),
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

  // ── mergeSources ──

  it('should_merge_incoming_into_existing_skipping_duplicate_links', () => {
    const existing = [
      makeJob({ link: 'https://a.com/1', company: 'Existing' }),
      makeJob({ link: 'https://a.com/2', company: 'Existing' }),
    ];
    const incoming = [
      makeJob({ link: 'https://a.com/2', company: 'Duplicate' }),
      makeJob({ link: 'https://a.com/3', company: 'New' }),
    ];
    const result = engine.mergeSources(existing, incoming);
    expect(result).toHaveLength(3);
    expect(result[1].company).toBe('Existing');
  });

  it('should_merge_all_when_no_overlap', () => {
    const existing = [makeJob({ link: 'https://a.com/1' })];
    const incoming = [makeJob({ link: 'https://a.com/2' })];
    expect(engine.mergeSources(existing, incoming)).toHaveLength(2);
  });

  it('should_keep_existing_order_then_append_new', () => {
    const existing = [makeJob({ link: 'https://a.com/1', company: 'First' })];
    const incoming = [makeJob({ link: 'https://a.com/2', company: 'Second' })];
    const result = engine.mergeSources(existing, incoming);
    expect(result[0].company).toBe('First');
    expect(result[1].company).toBe('Second');
  });

  it('should_return_existing_when_incoming_is_empty', () => {
    const existing = [makeJob({ link: 'https://a.com/1' })];
    expect(engine.mergeSources(existing, [])).toHaveLength(1);
  });
});
