import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatRepository } from '@/lib/infrastructure/repositories';

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const conversations = await chatRepository.listChats(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[chat-conversations] Error loading:', error);
    return NextResponse.json([], { status: 500 });
  }
}
