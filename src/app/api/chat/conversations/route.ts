import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chatRepository } from '@/lib/infrastructure/repositories';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const conversations = await chatRepository.listChats(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[chat-conversations] Error loading:', error);
    return NextResponse.json([], { status: 500 });
  }
}
