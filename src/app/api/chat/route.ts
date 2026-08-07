import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from 'ai';
import { requireAuth } from '@/lib/api/auth-guard';
import { chatLlm } from '@/lib/core/ai/llm-provider';
import { createChatTools } from '@/lib/core/ai/chat-tools';
import { chatRepository, profileRepository } from '@/lib/infrastructure/repositories';
import { acquireChatLock, releaseChatLock } from '@/lib/infrastructure/redis/chat-lock';
import { getGlobalBudgetStatus, addGlobalBudgetCost } from '@/lib/infrastructure/redis/global-budget';
import { CHAT_SYSTEM_PROMPT } from '@/lib/core/ai/chat-system-prompt';
import { logAiEvent } from '@/lib/core/ai/ai-logger';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  MAX_THREAD_MESSAGES,
  MAX_CONTEXT_MESSAGES,
  sanitizeChatMessages,
  isPromptInjection,
  type ChatMessageInput,
} from '@/lib/core/ai/chat-guard';

/** Estimativa determinística de tokens (~4 caracteres/token, padrão para texto em pt-BR). */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Extrai apenas os textos das mensagens para estimar o prompt. */
function messagesToText(messages: ChatMessageInput[]): string {
  return messages
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .filter(Boolean)
    .join(' ');
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const traceId = crypto.randomUUID();
  
  // Rate limiting por minuto (10 requisições/min por usuário+IP)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const ipHash = createHash('sha256').update(ip).digest('hex');
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

  // Concorrência: apenas 1 resposta em andamento por usuário
  const lockAcquired = await acquireChatLock(session.user.id);
  if (!lockAcquired) {
    return new Response(
      JSON.stringify({ error: 'Você já tem uma resposta em andamento. Aguarde ela terminar.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Tetos de tokens (diário + mensal) — soma do usuário + contas com o mesmo currículo (anti multi-conta) + teto por IP
  const profile = await profileRepository.findByUserId(session.user.id);
  const usageGroup = await profileRepository.findUserIdsByResumeHash(profile?.resumeHash ?? null, session.user.id);

  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  const startMonth = new Date(startDay.getFullYear(), startDay.getMonth(), 1);

  const [todayTokens, monthTokens, ipTokens, globalBudget] = await Promise.all([
    chatRepository.sumTokensSince(usageGroup, startDay),
    chatRepository.sumTokensSince(usageGroup, startMonth),
    chatRepository.sumTokensSinceByIp(ipHash, startDay),
    getGlobalBudgetStatus(),
  ]);

  const DAILY_TOKEN_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT ?? 100000);
  const MONTHLY_TOKEN_LIMIT = Number(process.env.MONTHLY_TOKEN_LIMIT ?? 2000000);
  const IP_DAILY_TOKEN_LIMIT = Number(process.env.IP_DAILY_TOKEN_LIMIT ?? 300000);

  if (
    todayTokens.totalTokens >= DAILY_TOKEN_LIMIT ||
    monthTokens.totalTokens >= MONTHLY_TOKEN_LIMIT ||
    ipTokens.totalTokens >= IP_DAILY_TOKEN_LIMIT
  ) {
    await releaseChatLock(session.user.id);
    return new Response(
      JSON.stringify({
        error: 'Limite diário de consumo de IA atingido. Os limites renovam à meia-noite (diário) e no dia 1º do mês (mensal).',
        code: 'TOKEN_LIMIT_REACHED',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Orçamento diário global (soma do custo de todos os usuários) — protege contra pico de custo agregado.
  if (globalBudget.exhausted) {
    await releaseChatLock(session.user.id);
    return new Response(
      JSON.stringify({
        error: 'O orçamento diário do projeto foi atingido. O chat volta a funcionar após a meia-noite.',
        code: 'GLOBAL_BUDGET_REACHED',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
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
      // Orçamento global perto do limite: respostas mais curtas em vez de bloquear todo mundo.
      maxOutputTokens: globalBudget.degraded
        ? Math.ceil(Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 2000) / 2)
        : Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 2000),
      onFinish: async (event: {
        text?: string;
        finishReason: unknown;
        steps?: { toolCalls?: { toolName: string }[] }[];
        usage?: {
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
          promptTokens?: number;
          completionTokens?: number;
        };
      }) => {
        // Uso reportado pelo provider (stream_options.include_usage).
        // Atenção: no AI SDK v7 os campos são inputTokens/outputTokens
        // (promptTokens/completionTokens são do v6). Nem todo provedor
        // OpenAI-compatível devolve o chunk final de usage — quando
        // ausente/zerado, estimamos por caracteres para o medidor nunca
        // ficar travado em 0.
        const reported = event.usage;
        const hasRealUsage = !!reported && (reported.totalTokens ?? 0) > 0;

        const usage = hasRealUsage
          ? {
              promptTokens: reported.inputTokens ?? reported.promptTokens ?? 0,
              completionTokens: reported.outputTokens ?? reported.completionTokens ?? 0,
              totalTokens: reported.totalTokens ?? 0,
            }
          : (() => {
              const promptTokens = estimateTokens(`${CHAT_SYSTEM_PROMPT} ${messagesToText(sanitizedMessages)}`);
              const completionTokens = estimateTokens(event.text ?? '');
              return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
            })();

        // Custo estimado (preços gpt-4o-mini em USD por 1M tokens; ajustáveis por env)
        const INPUT_PRICE_PER_1M = Number(process.env.AI_INPUT_PRICE_PER_1M ?? 0.15);
        const OUTPUT_PRICE_PER_1M = Number(process.env.AI_OUTPUT_PRICE_PER_1M ?? 0.6);
        const costUsd =
          (usage.promptTokens / 1_000_000) * INPUT_PRICE_PER_1M +
          (usage.completionTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;

        logAiEvent('chat_interaction', {
          traceId,
          messageCount: messages.length,
          textLength: event.text?.length || 0,
          finishReason: event.finishReason,
          toolCalls: event.steps?.flatMap((s) => s.toolCalls?.map((t) => t.toolName) || []),
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCostUsd: Number(costUsd.toFixed(5)),
          success: true,
        });

        // Persistência do uso (fire-and-forget; nunca derruba o stream)
        try {
          await chatRepository.recordUsage(session.user.id, {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            ipHash,
          });
        } catch (err) {
          console.error('[chat] Erro ao registrar usage:', err);
        }

        // Soma o custo desta interação no orçamento diário global (fire-and-forget)
        try {
          await addGlobalBudgetCost(costUsd);
        } catch (err) {
          console.error('[chat] Erro ao registrar orçamento global:', err);
        }

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

        await releaseChatLock(session.user.id);
      },
      onError: ({ error }: { error: unknown }) => {
        console.error('[chat] streamText onError:', error);
        void releaseChatLock(session.user.id);
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
    await releaseChatLock(session.user.id);
    return new Response(JSON.stringify({ error: 'Erro ao processar sua solicitação.' }), { status: 500 });
  }
}
