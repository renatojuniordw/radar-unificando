import { describe, it, expect } from 'vitest';
import { formatDayShort, formatDayFull, formatDateTimeSp } from '@/lib/core/admin/date-format';

describe('date-format', () => {
  it('should_format_day_short_as_dd_mm_yy', () => {
    expect(formatDayShort('2026-08-17')).toBe('17/08/26');
  });

  it('should_format_day_full_as_dd_mm_yyyy', () => {
    expect(formatDayFull('2026-08-17')).toBe('17/08/2026');
  });

  it('should_format_datetime_in_sao_paulo_timezone', () => {
    // 2026-08-17T14:30:00Z = 11:30 em São Paulo
    const formatted = formatDateTimeSp(new Date('2026-08-17T14:30:00Z'));
    expect(formatted).toContain('17/08/2026');
    expect(formatted).toContain('11:30');
  });
});