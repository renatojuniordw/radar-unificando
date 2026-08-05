import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatRepository } from '@/lib/infrastructure/repositories';

const DAILY_LIMIT = 50;

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const count = await chatRepository.getDailyUserMessageCount(session.user.id);
    const remaining = Math.max(0, DAILY_LIMIT - count);
    const isDailyLimitReached = count >= DAILY_LIMIT;

    return NextResponse.json({
      count,
      limit: DAILY_LIMIT,
      remaining,
      isDailyLimitReached,
    });
  } catch (error) {
    console.error('[chat-usage] Erro ao buscar contagem diária:', error);
    return NextResponse.json({ error: 'Erro ao verificar uso diário' }, { status: 500 });
  }
}
