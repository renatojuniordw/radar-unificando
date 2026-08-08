import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

describe('Rate Limiter Module', () => {
  it('deve permitir a primeira requisição dentro do limite', async () => {
    const testIp = `192.168.1.${Math.floor(Math.random() * 1000)}`;
    const result = await checkRateLimit(testIp, 'chat');
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBeGreaterThanOrEqual(0);
  });

  it('deve rejeitar requisições excedentes do limite de auth (5 requisições)', async () => {
    const testIp = `10.0.0.${Math.floor(Math.random() * 1000 + 100)}`;
    
    // Faz 5 requisições permitidas
    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(testIp, 'auth');
      expect(res.success).toBe(true);
    }

    // A 6ª requisição deve ser bloqueada (429)
    const blockedRes = await checkRateLimit(testIp, 'auth');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remainingPoints).toBe(0);
  });

  it('deve suportar chaves compostas (userId:IP)', async () => {
    const compositeKey = `user_12345:192.168.1.50`;
    const result = await checkRateLimit(compositeKey, 'chat');
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBeGreaterThanOrEqual(0);
  });
});
