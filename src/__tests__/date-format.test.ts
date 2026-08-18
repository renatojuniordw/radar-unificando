import { describe, it, expect } from 'vitest';
import { formatDayShort, formatDayFull, formatDateTimeSp } from '@/lib/core/admin/date-format';

describe('date-format', () => {
  it('formatDayShort_converte_para_dd_mm_aa', () => {
    expect(formatDayShort('2026-08-17')).toBe('17/08/26');
  });

  it('formatDayFull_converte_para_dd_mm_aaaa', () => {
    expect(formatDayFull('2026-08-17')).toBe('17/08/2026');
  });

  it('formatDateTimeSp_formata_no_fuso_sao_paulo', () => {
    // 2026-08-17T14:30:00Z = 11:30 em São Paulo
    const formatted = formatDateTimeSp(new Date('2026-08-17T14:30:00Z'));
    expect(formatted).toContain('17/08/2026');
    expect(formatted).toContain('11:30');
  });
});