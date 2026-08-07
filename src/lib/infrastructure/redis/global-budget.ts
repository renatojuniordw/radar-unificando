import { redisClient } from '@/lib/infrastructure/redis/client';

const GLOBAL_DAILY_BUDGET_USD = Number(process.env.GLOBAL_DAILY_BUDGET_USD ?? 0.95);
const WARN_RATIO = 0.8;
const KEY_TTL_SECONDS = 2 * 24 * 60 * 60;

export interface GlobalBudgetStatus {
  usedUsd: number;
  limitUsd: number;
  ratio: number;
  degraded: boolean;
  exhausted: boolean;
}

/** Classifica o uso do orçamento (função pura, sem I/O — facilita testar os limiares isoladamente). */
export function classifyBudget(usedUsd: number, limitUsd: number): GlobalBudgetStatus {
  const ratio = limitUsd > 0 ? usedUsd / limitUsd : 0;
  return {
    usedUsd,
    limitUsd,
    ratio,
    degraded: ratio >= WARN_RATIO && ratio < 1,
    exhausted: ratio >= 1,
  };
}

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `global_budget:cost:${y}-${m}-${d}`;
}

/** Lê o gasto agregado do dia. Fail-open: se o Redis estiver indisponível, retorna uso zero (não bloqueia ninguém). */
export async function getGlobalBudgetStatus(): Promise<GlobalBudgetStatus> {
  try {
    if (redisClient.status !== 'ready') return classifyBudget(0, GLOBAL_DAILY_BUDGET_USD);
    const raw = await redisClient.get(todayKey());
    return classifyBudget(raw ? Number(raw) : 0, GLOBAL_DAILY_BUDGET_USD);
  } catch {
    return classifyBudget(0, GLOBAL_DAILY_BUDGET_USD);
  }
}

/** Incrementa o gasto agregado do dia. Best-effort: nunca deve derrubar o stream de chat. */
export async function addGlobalBudgetCost(usd: number): Promise<void> {
  try {
    if (redisClient.status !== 'ready' || usd <= 0) return;
    const key = todayKey();
    await redisClient.incrbyfloat(key, usd);
    await redisClient.expire(key, KEY_TTL_SECONDS);
  } catch {
    // best-effort
  }
}
