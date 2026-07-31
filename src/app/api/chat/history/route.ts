import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CHATS_DIR = path.join(process.cwd(), '.chats');

async function ensureChatsDir() {
  if (!existsSync(CHATS_DIR)) {
    await mkdir(CHATS_DIR, { recursive: true });
  }
}

function getChatFile(userId: string, chatId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(CHATS_DIR, `${safeUserId}-${safeChatId}.json`);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId') || 'default';

  try {
    await ensureChatsDir();
    const filePath = getChatFile(session.user.id, chatId);
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ messages: [] });
    }

    const content = await readFile(filePath, 'utf-8');
    const messages = JSON.parse(content);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[chat-history] Error loading:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { chatId = 'default', messages } = await req.json();
    
    await ensureChatsDir();
    const filePath = getChatFile(session.user.id, chatId);
    
    await writeFile(filePath, JSON.stringify(messages, null, 2), 'utf-8');
    
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
    await ensureChatsDir();
    const filePath = getChatFile(session.user.id, chatId);
    
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chat-history] Error deleting:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
