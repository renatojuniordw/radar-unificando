import { NextRequest } from 'next/server';
import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from 'ai';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatLlm } from '@/lib/core/ai/llm-provider';
import { createChatTools } from '@/lib/core/ai/chat-tools';
import { chatRepository } from '@/lib/infrastructure/repositories';
import { CHAT_SYSTEM_PROMPT } from '@/lib/core/ai/chat-system-prompt';
import { logAiEvent } from '@/lib/core/ai/ai-logger';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  MAX_THREAD_MESSAGES,
  MAX_CONTEXT_MESSAGES,
  sanitizeChatMessages,
  isPromptInjection,
} from '@/lib/core/ai/chat-guard';

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const traceId = crypto.randomUUID();
  
  // Rate limiting por minuto (10 requisições/min por usuário+IP)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const rateLimitKey = `${session.user.id}:${ip.split(',')[0].trim()}`;
  const { success, msBeforeNext, remainingPoints } = await checkRateLimit(rateLimitKey, 'chat');
  
  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return new Response(
      JSON.stringify({ error: `Muitas mensagens em sequência. Aguarde ${retryAfterSeconds} segundos.` }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Remaining': String(remainingPoints),
        },
      }
    );
  }

  // Rate limiting diário por usuário (50 mensagens por dia)
  const dailyLimit = await checkRateLimit(session.user.id, 'chat_daily');
  const dbDailyCount = await chatRepository.getDailyUserMessageCount(session.user.id);

  if (!dailyLimit.success || dbDailyCount >= 50) {
    return new Response(
      JSON.stringify({ error: `Limite diário de interações atingido (50 mensagens/dia). O limite será renovado à meia-noite.` }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((dailyLimit.msBeforeNext || 3600000) / 1000)),
        },
      }
    );
  }


  try {
    const { messages } = await req.json();
    
    // Validar limite de 25 mensagens por conversa e avisar o usuário
    if (Array.isArray(messages) && messages.length >= MAX_THREAD_MESSAGES) {
      return new Response(
        JSON.stringify({
          error: 'Esta conversa atingiu o limite de 25 mensagens. Por favor, inicie um novo chat para continuar.',
          code: 'THREAD_LIMIT_REACHED',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Janela deslizante de contexto (enviar no máximo as 15 mensagens mais recentes para a LLM)
    const recentMessages = Array.isArray(messages) && messages.length > MAX_CONTEXT_MESSAGES
      ? messages.slice(-MAX_CONTEXT_MESSAGES)
      : (messages || []);

    // Validação e sanitização de input (incluindo anonimização de PII)
    const sanitizedMessages = sanitizeChatMessages(recentMessages);

    // Detectar padrões suspeitos (prompt injection)
    const isSuspicious = isPromptInjection(sanitizedMessages);

    if (isSuspicious) {
      logAiEvent('suspicious_activity', {
        traceId,
        userId: session.user.id,
        pattern: 'potential_prompt_injection',
        success: false,
      });

      return new Response(
        JSON.stringify({ error: 'Sua mensagem contém termos ou padrões não permitidos. Por favor, reformule sua pergunta.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = streamText({
      model: chatLlm,
      messages: await convertToModelMessages(sanitizedMessages as UIMessage[]),
      tools: createChatTools(session.user.id),
      stopWhen: stepCountIs(10),
      system: CHAT_SYSTEM_PROMPT,
      onFinish: async (event: {
        text?: string;
        finishReason: unknown;
        steps?: { toolCalls?: { toolName: string }[] }[];
      }) => {
        logAiEvent('chat_interaction', {
          traceId,
          messageCount: messages.length,
          textLength: event.text?.length || 0,
          finishReason: event.finishReason,
          toolCalls: event.steps?.flatMap((s) => s.toolCalls?.map((t) => t.toolName) || []),
          success: true,
        });

        // Persistência assíncrona do histórico se a IA gerou texto
        if (event.text && Array.isArray(messages)) {
          try {
            const updatedMessages = [
              ...messages,
              { role: 'assistant', parts: [{ type: 'text', text: event.text }] },
            ];
            await chatRepository.replaceMessages(session.user.id, 'default', updatedMessages);
          } catch (err) {
            console.error('[chat] Erro ao auto-salvar histórico:', err);
          }
        }
      },
      onError: ({ error }: { error: unknown }) => {
        console.error('[chat] streamText onError:', error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error: unknown) => {
        console.error('[chat] toUIMessageStreamResponse onError:', error);
        // Retornar mensagem de erro genérica sanitizada sem expor detalhes internos
        return 'Ocorreu um erro ao processar a resposta. Tente novamente em instantes.';
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
    return new Response(JSON.stringify({ error: 'Erro ao processar sua solicitação.' }), { status: 500 });
  }
}
