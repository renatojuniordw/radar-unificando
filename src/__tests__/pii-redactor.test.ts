import { describe, it, expect } from 'vitest';
import { redactPii, sanitizePiiInObject } from '@/lib/core/ai/pii-redactor';

describe('PII Redactor Module', () => {
  it('should_redact_formatted_and_unformatted_cpf', () => {
    const text = 'Meu CPF é 123.456.789-00 e o do meu amigo é 98765432111';
    const redacted = redactPii(text);
    expect(redacted).not.toContain('123.456.789-00');
    expect(redacted).not.toContain('98765432111');
    expect(redacted).toContain('[CPF REDIGIDO]');
  });

  it('should_redact_phones_and_cards', () => {
    const text = 'Contato: (11) 98765-4321 e cartão 4532111122223333';
    const redacted = redactPii(text);
    expect(redacted).toContain('[TELEFONE REDIGIDO]');
    expect(redacted).toContain('[CARTÃO REDIGIDO]');
  });

  it('should_sanitize_objects_recursively', () => {
    const input = [
      { role: 'user', content: 'Tenho o CPF 111.222.333-44' },
      { role: 'assistant', content: 'Entendido.' },
    ];
    const sanitized = sanitizePiiInObject(input);
    expect(sanitized[0].content).toBe('Tenho o CPF [CPF REDIGIDO]');
  });

  it('should_redact_a_plain_string_input', () => {
    expect(sanitizePiiInObject('Meu CPF é 123.456.789-00')).toBe('Meu CPF é [CPF REDIGIDO]');
  });

  it('should_pass_through_falsy_inputs', () => {
    expect(sanitizePiiInObject(null)).toBeNull();
    expect(sanitizePiiInObject(undefined)).toBeUndefined();
  });

  it('should_sanitize_nested_objects_and_keep_primitives', () => {
    const input = {
      user: { phone: '(11) 98765-4321' },
      count: 3,
      enabled: true,
    };
    const sanitized = sanitizePiiInObject(input);
    expect(sanitized.user.phone).toContain('[TELEFONE REDIGIDO]');
    expect(sanitized.count).toBe(3);
    expect(sanitized.enabled).toBe(true);
  });

  it('should_leave_non_object_primitives_untouched', () => {
    expect(sanitizePiiInObject(42)).toBe(42);
    expect(sanitizePiiInObject(true)).toBe(true);
  });
});
