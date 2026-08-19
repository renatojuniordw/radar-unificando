import { adminRepository } from '@/lib/infrastructure/repositories';
import type { DayCountRow } from '@/lib/infrastructure/repositories/admin-repository';

const DAY_MS = 24 * 60 * 60 * 1000;
// Brasil não adota horário de verão desde 2019 — offset fixo UTC-3.
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_KEY_TZ = 'America/Sao_Paulo';

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DAY_KEY_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Chave de dia (YYYY-MM-DD) no fuso America/Sao_Paulo. */
export function toDayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

/** Início do dia de hoje no fuso America/Sao_Paulo (meia-noite local → UTC). */
export function startOfToday(): Date {
  const parts = dayKeyFormatter.formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return new Date(Date.UTC(year, month - 1, day) - SAO_PAULO_OFFSET_MS);
}

/** Converte 'YYYY-MM-DD' em meia-noite no fuso America/Sao_Paulo. */
export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) - SAO_PAULO_OFFSET_MS);
}

export interface AdminDateRange {
  /** Início do primeiro dia (meia-noite SP), inclusivo. */
  from: Date;
  /** Início do último dia (meia-noite SP), inclusivo. */
  to: Date;
}

/** Intervalo dos últimos `days` dias (incluindo hoje). */
export function rangeFromDays(days: number): AdminDateRange {
  const to = startOfToday();
  return { from: new Date(to.getTime() - (days - 1) * DAY_MS), to };
}

/** Intervalo personalizado a partir de chaves 'YYYY-MM-DD'. */
export function rangeFromDates(fromKey: string, toKey: string): AdminDateRange {
  return { from: parseDayKey(fromKey), to: parseDayKey(toKey) };
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve o intervalo a partir dos query params da página admin.
 * Prioriza `from`/`to` (personalizado); senão usa `days` (15/30/365...); default 30.
 */
export function resolveAdminRange(params: { days?: string; from?: string; to?: string }): AdminDateRange {
  if (params.from && params.to && DAY_KEY_RE.test(params.from) && DAY_KEY_RE.test(params.to)) {
    // URL direta pode trazer from > to — normaliza com swap em vez de devolver range inválido.
    const [from, to] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
    return rangeFromDates(from, to);
  }
  const days = Number(params.days);
  if (Number.isInteger(days) && days >= 1 && days <= 3650) return rangeFromDays(days);
  return rangeFromDays(30);
}

export interface DayCount {
  date: string;
  count: number;
}

/**
 * Preenche a série de `days` dias (a partir de `since`, fuso America/Sao_Paulo)
 * com as contagens já agregadas no Postgres (dailyCountsSince), zerando dias
 * sem ocorrências.
 */
export function fillDayCounts(rows: DayCountRow[], days: number, since: Date): DayCount[] {
  const counts = new Map<string, number>(rows.map((r) => [r.dateKey, r.count]));
  const result: DayCount[] = [];
  for (let i = 0; i < days; i++) {
    const key = toDayKey(new Date(since.getTime() + i * DAY_MS));
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface AdminStats {
  summary: {
    totalUsers: number;
    usersToday: number;
    loginsToday: number;
    searchesToday: number;
    anonymousSearchesToday: number;
    failedSearchesToday: number;
    jobsFoundToday: number;
    chatMessagesToday: number;
    tokensToday: number;
    courseClicksToday: number;
    extensionTokens: number;
  };
  timeSeries: {
    usersPerDay: DayCount[];
    loginsPerDay: DayCount[];
    searchesPerDay: DayCount[];
  };
  top: {
    toolUsage: NameCount[];
  };
}

/** Métricas agregadas do painel admin para o intervalo `range` (séries/top) + resumo de hoje. */
export async function getAdminStats(range: AdminDateRange): Promise<AdminStats> {
  const today = startOfToday();
  const since = range.from;
  const days = Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS) + 1;

  const [
    totalUsers,
    usersToday,
    loginsToday,
    searchesToday,
    anonymousSearchesToday,
    failedSearchesToday,
    jobsFoundToday,
    chatMessagesToday,
    tokensToday,
    courseClicksToday,
    extensionTokens,
    userDayRows,
    loginDayRows,
    searchDayRows,
    toolCalls,
  ] = await Promise.all([
    adminRepository.countUsers(),
    adminRepository.countUsersSince(today),
    adminRepository.countLoginsSince(today),
    adminRepository.countSearchesSince(today),
    adminRepository.countAnonymousSearchesSince(today),
    adminRepository.countFailedSearchesSince(today),
    adminRepository.sumJobsFoundSince(today),
    adminRepository.countChatMessagesSince(today),
    adminRepository.sumTokensSince(today),
    adminRepository.countCourseClicksSince(today),
    adminRepository.countExtensionTokens(),
    adminRepository.dailyCountsSince('users_created', since),
    adminRepository.dailyCountsSince('users_login', since),
    adminRepository.dailyCountsSince('pipeline_runs', since),
    adminRepository.toolCallsSince(since),
  ]);

  return {
    summary: {
      totalUsers,
      usersToday,
      loginsToday,
      searchesToday,
      anonymousSearchesToday,
      failedSearchesToday,
      jobsFoundToday,
      chatMessagesToday,
      tokensToday,
      courseClicksToday,
      extensionTokens,
    },
    timeSeries: {
      usersPerDay: fillDayCounts(userDayRows, days, since),
      loginsPerDay: fillDayCounts(loginDayRows, days, since),
      searchesPerDay: fillDayCounts(searchDayRows, days, since),
    },
    top: {
      toolUsage: toolCalls.map((t) => ({ name: t.toolName, count: t.count })),
    },
  };
}