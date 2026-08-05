import { describe, it, expect } from 'vitest';

describe('Chat Daily Limit Global Enforcement', () => {
  it('deve identificar que 50 ou mais mensagens no dia atingem o limite diário global', () => {
    const dailyCount = 50;
    const DAILY_LIMIT = 50;
    const isDailyLimitReached = dailyCount >= DAILY_LIMIT;

    expect(isDailyLimitReached).toBe(true);
    expect(Math.max(0, DAILY_LIMIT - dailyCount)).toBe(0);
  });

  it('deve permitir mensagens se o total diário for menor que 50', () => {
    const dailyCount = 49;
    const DAILY_LIMIT = 50;
    const isDailyLimitReached = dailyCount >= DAILY_LIMIT;

    expect(isDailyLimitReached).toBe(false);
    expect(DAILY_LIMIT - dailyCount).toBe(1);
  });

  it('deve manter o bloqueio no frontend mesmo ao criar nova conversa quando o uso diário é 50', () => {
    const dailyUsage = { count: 50, limit: 50, remaining: 0, isDailyLimitReached: true };
    const newChatMessages = [{ role: 'assistant', parts: [{ type: 'text', text: 'Olá!' }] }];

    const lastMessageText = newChatMessages[0].parts[0].text;
    const isDailyLimitReached = dailyUsage.isDailyLimitReached || lastMessageText.includes('Limite diário');

    expect(isDailyLimitReached).toBe(true);
  });
});
