import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

/** Gera um token de extensão em texto puro (entregue uma única vez ao usuário). */
export function generateExtensionToken(): string {
  return randomBytes(32).toString('hex');
}

/** Hash SHA-256 do token — o texto puro nunca é armazenado no banco. */
export function hashExtensionToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Cria um token de extensão para o usuário, armazenando apenas o hash.
 * Retorna o token em texto puro para ser entregue uma única vez.
 */
export async function createExtensionToken(userId: string): Promise<string> {
  const raw = generateExtensionToken();
  await prisma.extensionToken.create({
    data: { userId, tokenHash: hashExtensionToken(raw) },
  });
  return raw;
}

/**
 * Resolve o userId a partir de um token em texto puro.
 * Retorna `null` se o token não existir ou estiver revogado.
 * Atualiza `lastUsedAt` a cada uso válido.
 */
export async function findUserIdByExtensionToken(raw: string): Promise<string | null> {
  const tokenHash = hashExtensionToken(raw);
  const token = await prisma.extensionToken.findFirst({
    where: { tokenHash, revokedAt: null },
  });
  if (!token) return null;

  await prisma.extensionToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  });

  return token.userId;
}