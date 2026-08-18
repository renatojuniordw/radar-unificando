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
    usersSince: vi.fn(),
    loginsSince: vi.fn(),
    searchesSince: vi.fn(),
    toolCallsSince: vi.fn(),
    searchLogSince: vi.fn(),
  },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  adminRepository: mockAdminRepository,
}));

import {
  getAdminStats,
  bucketByDay,
  countOccurrences,
  toDayKey,
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
    mockAdminRepository.usersSince.mockResolvedValue([]);
    mockAdminRepository.loginsSince.mockResolvedValue([]);
    mockAdminRepository.searchesSince.mockResolvedValue([]);
    mockAdminRepository.toolCallsSince.mockResolvedValue([]);
    mockAdminRepository.searchLogSince.mockResolvedValue([]);
  });

  describe('toDayKey', () => {
    it('formata_data_no_fuso_sao_paulo', () => {
      // 2026-08-17T02:59:00Z = 2026-08-16 23:59 em São Paulo
      expect(toDayKey(new Date('2026-08-17T02:59:00Z'))).toBe('2026-08-16');
      expect(toDayKey(new Date('2026-08-17T03:00:00Z'))).toBe('2026-08-17');
    });
  });

  describe('bucketByDay', () => {
    it('preenche_dias_vazios_com_zero', () => {
      const since = new Date('2026-08-15T03:00:00Z'); // 2026-08-15 00:00 em SP
      const rows = [
        { date: new Date('2026-08-15T10:00:00Z') },
        { date: new Date('2026-08-15T12:00:00Z') },
      ];
      const result = bucketByDay(rows, 3, since);
      expect(result).toEqual([
        { date: '2026-08-15', count: 2 },
        { date: '2026-08-16', count: 0 },
        { date: '2026-08-17', count: 0 },
      ]);
    });

    it('ignora_linhas_fora_da_janela', () => {
      const since = new Date('2026-08-15T03:00:00Z');
      const rows = [{ date: new Date('2026-08-14T10:00:00Z') }]; // antes da janela
      const result = bucketByDay(rows, 2, since);
      expect(result).toEqual([
        { date: '2026-08-15', count: 0 },
        { date: '2026-08-16', count: 0 },
      ]);
    });
  });

  describe('countOccurrences', () => {
    it('conta_e_ordena_por_frequencia_ignorando_vazios', () => {
      const result = countOccurrences(['Analista', 'Dev', 'Analista', '  ', 'Dev', 'Dev']);
      expect(result).toEqual([
        { name: 'Dev', count: 3 },
        { name: 'Analista', count: 2 },
      ]);
    });
  });

  describe('resolveAdminRange', () => {
    it('usa_days_quando_informado', () => {
      const range = resolveAdminRange({ days: '15' });
      expect(range.to.getTime()).toBe(rangeFromDays(15).to.getTime());
      expect(range.from.getTime()).toBe(rangeFromDays(15).from.getTime());
    });

    it('usa_from_to_quando_informados', () => {
      const range = resolveAdminRange({ from: '2026-08-01', to: '2026-08-10' });
      expect(range.from.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').from.getTime());
      expect(range.to.getTime()).toBe(rangeFromDates('2026-08-01', '2026-08-10').to.getTime());
    });

    it('ignora_days_invalido_e_usa_default_30', () => {
      const range = resolveAdminRange({ days: 'abc' });
      expect(range.from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });

    it('ignora_from_sem_to', () => {
      const range = resolveAdminRange({ from: '2026-08-01' });
      expect(range.from.getTime()).toBe(rangeFromDays(30).from.getTime());
    });
  });

  describe('getAdminStats', () => {
    it('monta_summary_series_e_top', async () => {
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
      mockAdminRepository.usersSince.mockResolvedValue([{ createdAt: new Date('2026-08-17T10:00:00Z') }]);
      mockAdminRepository.loginsSince.mockResolvedValue([]);
      mockAdminRepository.searchesSince.mockResolvedValue([{ startedAt: new Date('2026-08-17T10:00:00Z') }]);
      mockAdminRepository.toolCallsSince.mockResolvedValue([{ toolName: 'search_jobs', count: 5 }]);
      mockAdminRepository.searchLogSince.mockResolvedValue([
        { queries: ['Analista', 'Dev'], companies: ['iFood'] },
        { queries: ['Analista'], companies: ['iFood', 'Nubank'] },
      ]);

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
      expect(stats.timeSeries.searchesPerDay).toHaveLength(30);
      expect(stats.top.toolUsage).toEqual([{ name: 'search_jobs', count: 5 }]);
      expect(stats.top.topTerms).toEqual([
        { name: 'Analista', count: 2 },
        { name: 'Dev', count: 1 },
      ]);
      expect(stats.top.topCompanies).toEqual([
        { name: 'iFood', count: 2 },
        { name: 'Nubank', count: 1 },
      ]);
    });

    it('retorna_zeros_quando_sem_dados', async () => {
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
      expect(stats.top.topTerms).toEqual([]);
      expect(stats.top.topCompanies).toEqual([]);
    });
  });
});