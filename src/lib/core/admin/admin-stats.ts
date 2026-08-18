import { adminRepository } from '@/lib/infrastructure/repositories';

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
    return rangeFromDates(params.from, params.to);
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
 * Agrupa timestamps por dia (fuso America/Sao_Paulo) preenchendo dias vazios com 0.
 * `since` deve ser o início da janela; a janela cobre `days` dias a partir dele.
 */
export function bucketByDay(rows: { date: Date }[], days: number, since: Date): DayCount[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    counts.set(toDayKey(new Date(since.getTime() + i * DAY_MS)), 0);
  }
  for (const row of rows) {
    const key = toDayKey(row.date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}

export interface NameCount {
  name: string;
  count: number;
}

/** Converte linhas do repositório em { date } descartando timestamps nulos. */
function toDayRows<T>(rows: T[], pick: (row: T) => Date | null): { date: Date }[] {
  return rows.flatMap((row) => {
    const date = pick(row);
    return date ? [{ date }] : [];
  });
}

/** Conta ocorrências (ex.: termos/empresas buscados) e ordena por frequência desc. */
export function countOccurrences(values: string[]): NameCount[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
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
    topTerms: NameCount[];
    topCompanies: NameCount[];
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
    userRows,
    loginRows,
    searchRows,
    toolCalls,
    searchLog,
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
    adminRepository.usersSince(since),
    adminRepository.loginsSince(since),
    adminRepository.searchesSince(since),
    adminRepository.toolCallsSince(since),
    adminRepository.searchLogSince(since),
  ]);

  const terms = searchLog.flatMap((row) => row.queries ?? []);
  const companies = searchLog.flatMap((row) => row.companies ?? []);

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
      usersPerDay: bucketByDay(toDayRows(userRows, (r) => r.createdAt), days, since),
      loginsPerDay: bucketByDay(toDayRows(loginRows, (r) => r.lastLoginAt), days, since),
      searchesPerDay: bucketByDay(toDayRows(searchRows, (r) => r.startedAt), days, since),
    },
    top: {
      toolUsage: toolCalls.map((t) => ({ name: t.toolName, count: t.count })),
      topTerms: countOccurrences(terms).slice(0, 10),
      topCompanies: countOccurrences(companies).slice(0, 10),
    },
  };
}