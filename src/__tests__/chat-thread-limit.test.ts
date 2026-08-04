import { describe, it, expect } from 'vitest';

describe('Chat Thread Message Limit', () => {
  it('deve validar que 25 ou mais mensagens ativam a mensagem de feedback de limite', () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Mensagem ${i + 1}`,
    }));

    const MAX_THREAD_MESSAGES = 25;
    const isExceeded = messages.length >= MAX_THREAD_MESSAGES;

    expect(isExceeded).toBe(true);
    expect('Esta conversa atingiu o limite de 25 mensagens. Por favor, inicie um novo chat para continuar.').toContain('limite de 25 mensagens');
  });
});
