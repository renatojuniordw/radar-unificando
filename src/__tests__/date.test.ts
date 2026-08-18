import { describe, it, expect, vi, afterEach } from 'vitest';

import { formatJobDate, sortJobsByRecency } from '@/lib/utils/date';

describe('formatJobDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_prioritize_posted_at_over_detected_at', () => {
    const info = formatJobDate('2026-08-10T12:00:00Z', '2026-08-01T12:00:00Z');
    expect(info?.label).toBe('Publicada');
    expect(info?.full).toContain('10/08/2026');
  });

  it('should_fall_back_to_detected_at_when_posted_at_invalid', () => {
    const info = formatJobDate('data-invalida', '2026-08-01T12:00:00Z');
    expect(info?.label).toBe('Adicionada');
    expect(info?.full).toContain('01/08/2026');
  });

  it('should_return_null_when_no_valid_date', () => {
    expect(formatJobDate(undefined, undefined)).toBeNull();
    expect(formatJobDate('invalida', 'invalida')).toBeNull();
  });

  it('should_format_relative_label_for_minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T12:00:00Z'));
    const info = formatJobDate('2026-08-18T11:59:00Z');
    expect(info?.relative).toContain('minuto');
  });

  it('should_format_relative_label_for_hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T12:00:00Z'));
    const info = formatJobDate('2026-08-18T10:00:00Z');
    expect(info?.relative).toContain('hora');
  });

  it('should_format_relative_label_for_days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T12:00:00Z'));
    const info = formatJobDate('2026-08-15T12:00:00Z');
    expect(info?.relative).toContain('dia');
  });
});

describe('sortJobsByRecency', () => {
  it('should_sort_newest_first_by_posted_at', () => {
    const jobs = [
      { id: '1', postedAt: '2026-08-01' },
      { id: '2', postedAt: '2026-08-10' },
      { id: '3', postedAt: '2026-08-05' },
    ];
    expect(sortJobsByRecency(jobs).map((j) => j.id)).toEqual(['2', '3', '1']);
  });

  it('should_fall_back_to_detected_at_when_posted_at_missing', () => {
    const jobs = [
      { id: '1', detectedAt: '2026-08-01' },
      { id: '2', detectedAt: '2026-08-10' },
    ];
    expect(sortJobsByRecency(jobs).map((j) => j.id)).toEqual(['2', '1']);
  });

  it('should_not_mutate_original_array', () => {
    const jobs = [{ id: '1', postedAt: '2026-08-01' }, { id: '2', postedAt: '2026-08-10' }];
    sortJobsByRecency(jobs);
    expect(jobs.map((j) => j.id)).toEqual(['1', '2']);
  });

  it('should_handle_missing_dates_with_zero', () => {
    const jobs = [{ id: '1' }, { id: '2', postedAt: '2026-08-10' }];
    expect(sortJobsByRecency(jobs).map((j) => j.id)).toEqual(['2', '1']);
  });
});