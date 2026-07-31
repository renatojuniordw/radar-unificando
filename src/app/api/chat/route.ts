import { NextRequest } from 'next/server';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
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
      messages: await convertToModelMessages(messages),
      tools: createChatTools(session.user.id),
      stopWhen: stepCountIs(10),
      system: `Você é um assistente de carreira especializado em vagas de tecnologia no Brasil.

Você tem acesso a ferramentas que permitem:
1. Buscar vagas no Gupy (search_jobs) — use sempre que o usuário pedir vagas. Cada resultado já vem com título, empresa, tipo, local, link e descrição.
2. Ver seu perfil (get_my_profile) — para analisar compatibilidade
3. Analisar compatibilidade com uma vaga (analyze_job_fit) — passe o jobTitle e jobDescription retornados por search_jobs diretamente, não invente IDs

## REGRAS IMPORTANTES DE FORMATAÇÃO:

1. **SEMPRE divida suas respostas longas em múltiplas mensagens curtas**. Cada mensagem deve conter no máximo 2-3 parágrafos ou 1 item de vaga.
2. **Ao listar vagas**, envie CADA vaga como uma mensagem separada. Formato:
   - Mensagem 1: "Encontrei X vagas. Aqui está a primeira:"
   - Mensagem 2: [Dados da vaga 1 com link]
   - Mensagem 3: [Dados da vaga 2 com link]
   - Mensagem N: [Resumo/recomendação]
3. **Use separadores claros** entre seções (títulos, emojis, etc.)
4. **Nunca envie tabelas** — use listas ou cards com label: valor
5. **Links devem estar sozinhos em sua linha** para facilitar clique

## FORMATO DE CADA VAGA:
🏢 **Nome da Vaga** — Empresa
📍 Local | Tipo (Remoto/Híbrido/Presencial)
🔗 [link]

## EXEMPLO DE RESPOSTA (vagas):
Mensagem 1: "📋 Encontrei 5 vagas para você:"
Mensagem 2: "🟢 **Vaga 1** — Empresa X\n📍 Remoto | Brasil\n🔗 https://..."
Mensagem 3: "🟡 **Vaga 2** — Empresa Y\n📍 Híbrido | SP\n🔗 https://..."
Mensagem 4: "💡 Recomendação: A vaga da Empresa X é a melhor compatibilidade com seu perfil."

Seja objetivo e direto. Quando o usuário pedir para analisar uma vaga, use analyze_job_fit com os dados que search_jobs já retornou.

Use search_jobs no máximo 2 vezes por pergunta. Depois de obter os resultados, SEMPRE finalize com uma resposta em texto para o usuário.
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
    console.error('[chat] Error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
