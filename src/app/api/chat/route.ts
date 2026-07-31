import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { chatLlm } from '@/lib/core/ai/llm-provider';
import { createChatTools } from '@/lib/core/ai/chat-tools';
import { logAiEvent } from '@/lib/core/ai/ai-logger';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  const traceId = crypto.randomUUID();

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: chatLlm,
      messages,
      tools: createChatTools(session.user.id),
      system: `Você é um assistente de carreira especializado em vagas de tecnologia no Brasil.

Você tem acesso a ferramentas que permitem:
1. Buscar vagas no Gupy (search_jobs) — use sempre que o usuário pedir vagas
2. Ver seu perfil (get_my_profile) — para analisar compatibilidade
3. Ver detalhes de uma vaga específica (get_job_details) — ID da vaga

Seja objetivo e direto. Quando listar vagas, inclua título, empresa e tipo (remoto/presencial).
Sempre responda em português.`,
      onFinish: async (event: any) => {
        logAiEvent('chat_interaction', {
          traceId,
          messageCount: messages.length,
          textLength: event.text?.length || 0,
          finishReason: event.finishReason,
          toolCalls: event.steps?.flatMap((s: any) => s.toolCalls?.map((t: any) => t.toolName) || []),
          success: true,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no chat';
    logAiEvent('chat_interaction', {
      traceId,
      success: false,
      error: message,
    });
    console.error('[chat] Error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
