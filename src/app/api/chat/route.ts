import { NextRequest } from 'next/server';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { auth } from '@/auth';
import { chatLlm } from '@/lib/core/ai/llm-provider';
import { createChatTools } from '@/lib/core/ai/chat-tools';
import { CHAT_SYSTEM_PROMPT } from '@/lib/core/ai/chat-system-prompt';
import { logAiEvent } from '@/lib/core/ai/ai-logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { redactPii } from '@/lib/core/ai/pii-redactor';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

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
  if (!dailyLimit.success) {
    const retryAfterHours = Math.ceil(dailyLimit.msBeforeNext / (1000 * 60 * 60));
    return new Response(
      JSON.stringify({ error: `Limite diário de interações atingido (50 mensagens/dia). O limite será renovado em aproximadamente ${retryAfterHours} horas.` }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(dailyLimit.msBeforeNext / 1000)),
        },
      }
    );
  }


  try {
    const { messages } = await req.json();
    
    // Validar limite de 25 mensagens por conversa e avisar o usuário
    const MAX_THREAD_MESSAGES = 25;
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
    const MAX_CONTEXT_MESSAGES = 15;
    const recentMessages = Array.isArray(messages) && messages.length > MAX_CONTEXT_MESSAGES
      ? messages.slice(-MAX_CONTEXT_MESSAGES)
      : (messages || []);

    // Validação e sanitização de input (incluindo anonimização de PII)
    const sanitizedMessages = recentMessages.map((msg: any) => {
      if (msg.role === 'user') {
        // Limitar tamanho da mensagem
        const text = (msg.content || '').slice(0, 2000);
        // Anonimizar PII (CPF, RG, Telefone, Cartões) em conformidade com LGPD
        const redacted = redactPii(text);
        // Remover caracteres potencialmente perigosos
        const clean = redacted
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
