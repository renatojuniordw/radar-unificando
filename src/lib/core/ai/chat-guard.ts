import { redactPii } from '@/lib/core/ai/pii-redactor';

export const MAX_THREAD_MESSAGES = 25;
export const MAX_CONTEXT_MESSAGES = 15;
export const MAX_MESSAGE_LENGTH = 2000;

const SUSPICIOUS_PATTERNS = [
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

interface ChatMessageInput {
  role?: string;
  content?: string;
}

/** Sanitiza mensagens de usuário: limita tamanho, anonimiza PII (LGPD) e remove HTML. */
export function sanitizeChatMessages(messages: ChatMessageInput[]): ChatMessageInput[] {
  return messages.map((msg) => {
    if (msg.role === 'user') {
      const text = (msg.content || '').slice(0, MAX_MESSAGE_LENGTH);
      const redacted = redactPii(text);
      const clean = redacted.replace(/[<>]/g, '').trim();
      return { ...msg, content: clean };
    }
    return msg;
  });
}

/** Detecta padrões suspeitos de prompt injection nas mensagens. */
export function isPromptInjection(messages: ChatMessageInput[]): boolean {
  return SUSPICIOUS_PATTERNS.some((p) => messages.some((m) => p.test(m.content || '')));
}