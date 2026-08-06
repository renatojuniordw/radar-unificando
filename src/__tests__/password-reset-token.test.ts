import { describe, it, expect } from 'vitest';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  RESET_TOKEN_TTL_MS,
} from '@/lib/core/auth/password-reset-token';

const HEX_64 = /^[0-9a-f]{64}$/;

describe('password-reset-token', () => {
  it('deve_gerar_hash_hex_de_64_caracteres', () => {
    expect(hashPasswordResetToken('qualquer-coisa')).toMatch(HEX_64);
  });

  it('deve_ser_deterministico_para_a_mesma_entrada', () => {
    const token = 'a'.repeat(64);
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });

  it('deve_gerar_hashes_diferentes_para_entradas_diferentes', () => {
    expect(hashPasswordResetToken('a'.repeat(64))).not.toBe(hashPasswordResetToken('b'.repeat(64)));
  });

  it('deve_gerar_token_de_64_hex_com_hash_correspondente_e_expirar_em_1h', () => {
    const before = Date.now();
    const { token, hash, expiresAt } = generatePasswordResetToken();

    expect(token).toMatch(HEX_64);
    expect(hash).toBe(hashPasswordResetToken(token));
    expect(token).not.toBe(hash);

    const diff = expiresAt.getTime() - before;
    expect(Math.abs(diff - RESET_TOKEN_TTL_MS)).toBeLessThan(5000);
  });
});