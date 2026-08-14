export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
}

export interface ChatMessage {
  id?: string;
  role: string;
  parts?: { type: string; text?: string }[];
  content?: string;
}

export const CHAT_SUGGESTIONS = [
  'Quais vagas de DevOps estão abertas?',
  'Analise meu perfil para vagas remotas',
  'Recomende vagas de Front-end com React',
  'Como está o mercado de dados?',
];

import { MAX_THREAD_MESSAGES } from '@/lib/core/ai/chat-guard';
export const CHAT_THREAD_MESSAGE_LIMIT = MAX_THREAD_MESSAGES;

export function getMessageText(msg: { parts?: { type: string; text?: string }[] }): string {
  return (msg.parts || [])
    .filter(p => p.type === 'text' && p.text)
    .map(p => p.text || '')
    .join(' ');
}

export function createWelcomeMessage(userName?: string | null) {
  const firstName = userName ? userName.trim().split(' ')[0] : '';
  const greetingHeader = firstName ? `Olá, **${firstName}**! 👋` : `Olá! 👋`;

  const text = `${greetingHeader} Sou seu assistente de carreira no Radar. Estou aqui para te ajudar a encontrar as melhores vagas e acelerar seus objetivos profissionais!

Como posso te apoiar hoje?

• 🔍 **Buscar vagas no Gupy** alinhadas ao seu perfil
• 📄 **Analisar seu currículo** e sugerir pontos de melhoria
• 📊 **Avaliar sua compatibilidade (fit)** com vagas de tecnologia
• 🎤 **Simular uma entrevista** com feedback profissional em tempo real

*Escolha uma das sugestões abaixo ou fique à vontade para digitar!*`;

  return {
    id: 'welcome-message',
    role: 'assistant' as const,
    parts: [{ type: 'text' as const, text }],
  };
}

export async function loadMessagesFromServer(chatId: string = 'default'): Promise<{ messages: ChatMessage[]; error: boolean }> {
  try {
    const res = await fetch(`/api/chat/history?chatId=${chatId}`);
    if (res.ok) {
      const data = await res.json();
      // Normaliza mensagens legadas ({ role, content }) para o shape V4 com parts
      const messages: ChatMessage[] = (data.messages || []).map((m: ChatMessage) => ({
        ...m,
        parts: m.parts || (m.content ? [{ type: 'text', text: m.content }] : []),
      }));
      return { messages, error: false };
    }
    return { messages: [], error: true };
  } catch {
    return { messages: [], error: true };
  }
}

export async function saveMessagesToServer(chatId: string, messages: ChatMessage[]): Promise<boolean> {
  try {
    const res = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, messages }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function generateChatId(): string {
  // crypto.randomUUID só existe em contexto seguro (HTTPS/localhost); fallback
  // para ambientes HTTP não-seguros (ex.: dev na rede local) sem quebrar.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `chat-${crypto.randomUUID()}`;
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
