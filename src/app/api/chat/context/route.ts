import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatRepository } from '@/lib/infrastructure/repositories';

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const chatId = req.nextUrl.searchParams.get('chatId') || undefined;

  try {
    const contextTokens = await chatRepository.getLastContextTokens(session.user.id, chatId);
    return NextResponse.json({ contextTokens: contextTokens ?? 0 });
  } catch {
    return NextResponse.json({ contextTokens: 0 });
  }
}
