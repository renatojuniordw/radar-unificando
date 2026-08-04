import { describe, it, expect } from 'vitest';
import { redactPii, sanitizePiiInObject } from '@/lib/core/ai/pii-redactor';

describe('PII Redactor Module', () => {
  it('deve redigir CPF formatado e não formatado', () => {
    const text = 'Meu CPF é 123.456.789-00 e o do meu amigo é 98765432111';
    const redacted = redactPii(text);
    expect(redacted).not.toContain('123.456.789-00');
    expect(redacted).not.toContain('98765432111');
    expect(redacted).toContain('[CPF REDIGIDO]');
  });

  it('deve redigir telefones e cartões', () => {
    const text = 'Contato: (11) 98765-4321 e cartão 4532111122223333';
    const redacted = redactPii(text);
    expect(redacted).toContain('[TELEFONE REDIGIDO]');
    expect(redacted).toContain('[CARTÃO REDIGIDO]');
  });

  it('deve sanitizar objetos recursivamente', () => {
    const input = [
      { role: 'user', content: 'Tenho o CPF 111.222.333-44' },
      { role: 'assistant', content: 'Entendido.' },
    ];
    const sanitized = sanitizePiiInObject(input);
    expect(sanitized[0].content).toBe('Tenho o CPF [CPF REDIGIDO]');
  });
});
