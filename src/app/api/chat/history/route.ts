import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chatRepository } from '@/lib/infrastructure/repositories';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId') || 'default';

  try {
    const messages = await chatRepository.getMessages(session.user.id, chatId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[chat-history] Error loading:', error);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { chatId = 'default', messages } = await req.json();
    await chatRepository.replaceMessages(session.user.id, chatId, messages);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chat-history] Error saving:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId') || 'default';

  try {
    await chatRepository.deleteChat(session.user.id, chatId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chat-history] Error deleting:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
