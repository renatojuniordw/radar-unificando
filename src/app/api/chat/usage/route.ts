import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatRepository } from '@/lib/infrastructure/repositories';
import { getGlobalBudgetStatus } from '@/lib/infrastructure/redis/global-budget';

const DAILY_INTERACTION_LIMIT = 50;
const DAILY_TOKEN_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT ?? 100000);
const MONTHLY_TOKEN_LIMIT = Number(process.env.MONTHLY_TOKEN_LIMIT ?? 2000000);

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const [count, today, month, globalBudget] = await Promise.all([
      chatRepository.getDailyUserMessageCount(session.user.id),
      chatRepository.sumTokensSince([session.user.id], startOfDay()),
      chatRepository.sumTokensSince([session.user.id], startOfMonth()),
      getGlobalBudgetStatus(),
    ]);

    const isTokenLimitReached =
      today.totalTokens >= DAILY_TOKEN_LIMIT || month.totalTokens >= MONTHLY_TOKEN_LIMIT;

    return NextResponse.json({
      count,
      limit: DAILY_INTERACTION_LIMIT,
      remaining: Math.max(0, DAILY_INTERACTION_LIMIT - count),
      isDailyLimitReached: count >= DAILY_INTERACTION_LIMIT,
      dailyTokens: today.totalTokens,
      dailyTokenLimit: DAILY_TOKEN_LIMIT,
      dailyTokenRemaining: Math.max(0, DAILY_TOKEN_LIMIT - today.totalTokens),
      monthlyTokens: month.totalTokens,
      monthlyTokenLimit: MONTHLY_TOKEN_LIMIT,
      monthlyTokenRemaining: Math.max(0, MONTHLY_TOKEN_LIMIT - month.totalTokens),
      isTokenLimitReached,
      globalBudget: {
        usedUsd: globalBudget.usedUsd,
        limitUsd: globalBudget.limitUsd,
        ratio: globalBudget.ratio,
        degraded: globalBudget.degraded,
        exhausted: globalBudget.exhausted,
      },
    });
  } catch (error) {
    console.error('[chat-usage] Erro ao buscar uso:', error);
    return NextResponse.json({ error: 'Erro ao verificar uso' }, { status: 500 });
  }
}
