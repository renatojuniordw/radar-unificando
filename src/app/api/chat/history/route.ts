import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatRepository } from '@/lib/infrastructure/repositories';
import { sanitizePiiInObject } from '@/lib/core/ai/pii-redactor';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

const chatIdSchema = z.string().max(100).default('default');

const postBodySchema = z.object({
  chatId: z.string().max(100).default('default'),
  messages: z.array(z.any()),
});

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const parsed = chatIdSchema.safeParse(searchParams.get('chatId') || 'default');
  const chatId = parsed.success ? parsed.data : 'default';

  const { success } = await checkRateLimit(session.user.id, 'general');
  if (!success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }

  try {
    const messages = await chatRepository.getMessages(session.user.id, chatId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[chat-history] Error loading:', error);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { success } = await checkRateLimit(session.user.id, 'general');
  if (!success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { chatId, messages } = parsed.data;
  const sanitizedMessages = sanitizePiiInObject(messages);

  try {
    await chatRepository.replaceMessages(session.user.id, chatId, sanitizedMessages);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chat-history] Error saving:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const parsed = chatIdSchema.safeParse(searchParams.get('chatId') || 'default');
  const chatId = parsed.success ? parsed.data : 'default';

  const { success } = await checkRateLimit(session.user.id, 'general');
  if (!success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }

  try {
    await chatRepository.deleteChat(session.user.id, chatId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chat-history] Error deleting:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
