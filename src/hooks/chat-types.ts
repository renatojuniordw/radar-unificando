/** Tipos compartilhados entre hooks de chat. */

export interface GlobalBudgetUsage {
  usedUsd: number;
  limitUsd: number;
  ratio: number;
  degraded: boolean;
  exhausted: boolean;
}

export interface DailyUsage {
  count: number;
  limit: number;
  remaining: number;
  isDailyLimitReached: boolean;
  dailyTokens: number;
  dailyTokenLimit: number;
  dailyTokenRemaining: number;
  monthlyTokens: number;
  monthlyTokenLimit: number;
  monthlyTokenRemaining: number;
  isTokenLimitReached: boolean;
  contextTokens?: number;
  globalBudget?: GlobalBudgetUsage;
}
