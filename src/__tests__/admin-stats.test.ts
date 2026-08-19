import { describe, it, expect, vi, beforeEach } from 'vitest';

const { adminRepository: mockAdminRepository } = vi.hoisted(() => ({
  adminRepository: {
    countUsers: vi.fn(),
    countUsersSince: vi.fn(),
    countLoginsSince: vi.fn(),
    countSearchesSince: vi.fn(),
    countFailedSearchesSince: vi.fn(),
    countAnonymousSearchesSince: vi.fn(),
    sumJobsFoundSince: vi.fn(),
    countChatMessagesSince: vi.fn(),
    sumTokensSince: vi.fn(),
    countCourseClicksSince: vi.fn(),
    countExtensionTokens: vi.fn(),
    dailyCountsSince: vi.fn(),
    toolCallsSince: vi.fn(),
  },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  adminRepository: mockAdminRepository,
}));

import {
  getAdminStats,
  fillDayCounts,
  toDayKey,
  parseDayKey,
  rangeFromDays,
  rangeFromDates,
  resolveAdminRange,
} from '@/lib/core/admin/admin-stats';

describe('admin-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminRepository.countUsers.mockResolvedValue(0);
    mockAdminRepository.countUsersSince.mockResolvedValue(0);
    mockAdminRepository.countLoginsSince.mockResolvedValue(0);
    mockAdminRepository.countSearchesSince.mockResolvedValue(0);
    mockAdminRepository.countFailedSearchesSince.mockResolvedValue(0);
    mockAdminRepository.countAnonymousSearchesSince.mockResolvedValue(0);
    mockAdminRepository.sumJobsFoundSince.mockResolvedValue(0);
    mockAdminRepository.countChatMessagesSince.mockResolvedValue(0);
    mockAdminRepository.sumTokensSince.mockResolvedValue(0);
    mockAdminRepository.countCourseClicksSince.mockResolvedValue(0);
    mockAdminRepository.countExtensionTokens.mockResolvedValue(0);
    mockAdminRepository.dailyCountsSince.mockResolvedValue([]);
    mockAdminRepository.toolCallsSince.mockResolvedValue([]);
  });

  describe('toDayKey', () => {
    it('should_format_date_in_sao_paulo_timezone', () => {
      // 2026-08-17T02:59:00Z = 2026-08-16 23:59 em São Paulo
      expect(toDayKey(new Date('2026-08-17T02:59:00Z'))).toBe('2026-08-16');
      expect(toDayKey(new Date('2026-08-17T03:00:00Z'))).toBe('2026-08-17');
    });
  });

  describe('fillDayCounts', () => {
    it('should_fill_empty_days_with_zero', () => {
      const since = new Date('2026-08-15T03:00:00Z'); // 2026-08-15 00:00 em SP
      const rows = [{ dateKey: '2026-08-15', count: 2 }];
      const result = fillDayCounts(rows, 3, since);
      expect(result).toEqual([
        { date: '2026-08-15', count: 2 },
        { date: '2026-08-16', count: 0 },
        { date: '2026-08-17', count: 0 },
      ]);
    });

    it('should_ignore_rows_outside_window', () => {
      const since = new Date('2026-08-15T03:00:00Z');
      const rows = [{ dateKey: '2026-08-14', count: 5 }]; // antes da janela
      const result = fillDayCounts(rows, 2, since);
      expect(result).toEqual([
        { date: '2026-08-15', count: 0 },
        { date: '2026-08-16', count: 0 },
      ]);
    });
  });

  describe('parseDayKey', () => {
    it('should_parse_day_key_to_sao_paulo_midnight', () => {
      // '2026-08-17' → meia-noite em SP = 2026-08-17T03:00:00Z
      expect(parseDayKey('2026-08-17').toISOString()).toBe('2026-08-17T03:00:00.000Z');
    });
  });

  describe('resolveAdminRange', () => {
    it('should_use_days_when_provided', () => {
      const range = resolveAdminRange({ days: '15' });
      expect(range.to.getTime()).toBe(rangeFromDays(15).to.getTime());
      expect(range.from.getTime()).toBe(rangeFromDays(15).from.getTime());
    });

    it('should_use_from_to_when_provided', () => {
      const range = resolveAdminRange({ from: '2026-08-01', to: '2026-08-10' });
      expect(range.from.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').from.getTime());
      expect(range.to.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').to.getTime());
    });

    it('should_swap_from_to_when_reversed', () => {
      // URL direta com from > to — normaliza com swap.
      const range = resolveAdminRange({ from: '2026-08-10', to: '2026-08-01' });
      expect(range.from.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').from.getTime());
      expect(range.to.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').to.getTime());
    });

    it('should_fallback_to_30_days_for_invalid_days', () => {
      const range = resolveAdminRange({ days: 'abc' });
      expect(range.from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });

    it('should_ignore_from_without_to', () => {
      const range = resolveAdminRange({ from: '2026-08-01' });
      expect(range.from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });

    it('should_ignore_malformed_from_to_pairs', () => {
      const range = resolveAdminRange({ from: '2026-08-01', to: '10/08/2026' });
      expect(range.from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });

    it('should_accept_days_boundary_values_1_and_3650', () => {
      expect(resolveAdminRange({ days: '1' }).from.getTime()).toBe(rangeFromDays(1).from.getTime());
      expect(resolveAdminRange({ days: '3650' }).from.getTime()).toBe(rangeFromDays(3650).from.getTime());
    });

    it('should_reject_days_outside_1_to_3650_and_use_default_30', () => {
      expect(resolveAdminRange({ days: '0' }).from.getTime()).toBe(rangeFromDays(30).from.getTime());
      expect(resolveAdminRange({ days: '3651' }).from.getTime()).toBe(rangeFromDays(30).from.getTime());
      expect(resolveAdminRange({ days: '15.5' }).from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });
  });

  describe('getAdminStats', () => {
    it('should_build_summary_series_and_top', async () => {
      mockAdminRepository.countUsers.mockResolvedValue(10);
      mockAdminRepository.countUsersSince.mockResolvedValue(1);
      mockAdminRepository.countLoginsSince.mockResolvedValue(2);
      mockAdminRepository.countSearchesSince.mockResolvedValue(3);
      mockAdminRepository.countAnonymousSearchesSince.mockResolvedValue(2);
      mockAdminRepository.countFailedSearchesSince.mockResolvedValue(1);
      mockAdminRepository.sumJobsFoundSince.mockResolvedValue(7);
      mockAdminRepository.countChatMessagesSince.mockResolvedValue(4);
      mockAdminRepository.sumTokensSince.mockResolvedValue(500);
      mockAdminRepository.countCourseClicksSince.mockResolvedValue(1);
      mockAdminRepository.countExtensionTokens.mockResolvedValue(2);
      mockAdminRepository.dailyCountsSince
        .mockResolvedValueOnce([{ dateKey: '2026-08-17', count: 1 }]) // users_created
        .mockResolvedValueOnce([]) // users_login
        .mockResolvedValueOnce([{ dateKey: '2026-08-17', count: 1 }]); // pipeline_runs
      mockAdminRepository.toolCallsSince.mockResolvedValue([{ toolName: 'search_jobs', count: 5 }]);

      const stats = await getAdminStats(rangeFromDays(30));

      expect(stats.summary).toEqual({
        totalUsers: 10,
        usersToday: 1,
        loginsToday: 2,
        searchesToday: 3,
        anonymousSearchesToday: 2,
        failedSearchesToday: 1,
        jobsFoundToday: 7,
        chatMessagesToday: 4,
        tokensToday: 500,
        courseClicksToday: 1,
        extensionTokens: 2,
      });
      expect(stats.timeSeries.usersPerDay).toHaveLength(30);
      expect(stats.timeSeries.usersPerDay.find((d) => d.date === '2026-08-17')?.count).toBe(1);
      expect(stats.timeSeries.searchesPerDay).toHaveLength(30);
      expect(stats.timeSeries.loginsPerDay.every((d) => d.count === 0)).toBe(true);
      expect(stats.top.toolUsage).toEqual([{ name: 'search_jobs', count: 5 }]);
    });

    it('should_return_zeros_when_no_data', async () => {
      const stats = await getAdminStats(rangeFromDays(30));
      expect(stats.summary).toEqual({
        totalUsers: 0,
        usersToday: 0,
        loginsToday: 0,
        searchesToday: 0,
        anonymousSearchesToday: 0,
        failedSearchesToday: 0,
        jobsFoundToday: 0,
        chatMessagesToday: 0,
        tokensToday: 0,
        courseClicksToday: 0,
        extensionTokens: 0,
      });
      expect(stats.top.toolUsage).toEqual([]);
      expect(stats.timeSeries.usersPerDay.every((d) => d.count === 0)).toBe(true);
    });
  });
});
