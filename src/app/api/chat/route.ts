import { NextRequest } from 'next/server';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { auth } from '@/auth';
import { chatLlm } from '@/lib/core/ai/llm-provider';
import { createChatTools } from '@/lib/core/ai/chat-tools';
import { CHAT_SYSTEM_PROMPT } from '@/lib/core/ai/chat-system-prompt';
import { logAiEvent } from '@/lib/core/ai/ai-logger';
import { RateLimiter } from '@/lib/infrastructure/security/rate-limiter';

// Rate limiter para chat (20 msgs/min por usuário)
const chatLimiter = new RateLimiter(60_000, 20);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  const traceId = crypto.randomUUID();
  
  // Rate limiting para chat
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = chatLimiter.check(`chat:${session.user.id}:${ip}`);
  
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Muitas mensagens. Aguarde um momento.' }), { status: 429 });
  }

  try {
    const { messages } = await req.json();
    
    // Validação e sanitização de input
    const sanitizedMessages = messages.map((msg: any) => {
      if (msg.role === 'user') {
        // Limitar tamanho da mensagem
        const text = (msg.content || '').slice(0, 2000);
        // Remover caracteres potencialmente perigosos
        const clean = text
          .replace(/[<>]/g, '') // Remove HTML tags básicos
          .trim();
        return { ...msg, content: clean };
      }
      return msg;
    });
    
    // Detectar padrões suspeitos (prompt injection)
    const suspiciousPatterns = [
      /ignore.*instructions/i,
      /system.*prompt/i,
      /reveal.*instructions/i,
      /bypass.*rules/i,
      /ignore.*previous/i,
      /disregard.*instructions/i,
      /jailbreak/i,
      /\bDAN\b/,
      /aja como/i,
      /finja que/i,
      /esque(ç|c)a (as )?instru(ç|c)(õ|o)es/i,
      /ignore (as )?instru(ç|c)(õ|o)es/i,
      /modo desenvolvedor/i,
      /voc(ê|e) n(ã|a)o tem regras/i,
      /repita (o|seu) prompt/i,
      /revele (seu|o) prompt/i,
      /qual (é|e) (seu|o) prompt/i,
    ];
    
    const isSuspicious = suspiciousPatterns.some((p) =>
      sanitizedMessages.some((m: any) => p.test(m.content || ''))
    );
    
    if (isSuspicious) {
      logAiEvent('suspicious_activity', {
        traceId,
        userId: session.user.id,
        pattern: 'potential_prompt_injection',
        success: false,
      });
    }

    const result = streamText({
      model: chatLlm,
      messages: await convertToModelMessages(sanitizedMessages),
      tools: createChatTools(session.user.id),
      stopWhen: stepCountIs(10),
      system: CHAT_SYSTEM_PROMPT,
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
      onError: ({ error }: { error: unknown }) => {
        console.error('[chat] streamText onError:', error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error: unknown) => {
        console.error('[chat] toUIMessageStreamResponse onError:', error);
        return error instanceof Error ? error.message : 'Erro ao processar a resposta.';
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no chat';
    logAiEvent('chat_interaction', {
      traceId,
      success: false,
      error: message,
    });
    console.error('[chat] Error:', error);
    return new Response(JSON.stringify({ error: 'Erro no chat' }), { status: 500 });
  }
}
