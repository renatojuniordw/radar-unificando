import { createHash, randomBytes } from 'node:crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const TOKEN_BYTES = 32; // 64 chars hex

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generatePasswordResetToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  return {
    token,
    hash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}