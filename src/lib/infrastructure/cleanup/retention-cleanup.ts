import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface CleanupResult {
  deletedExpiredCache: number;
  deletedInactiveChats: number;
}

/** Chats sem atividade há este período são removidos (junto com as mensagens, via cascade). */
function parseInactiveChatMonths(): number {
  const raw = Number(process.env.RETENTION_INACTIVE_CHAT_MONTHS);
  // Env inválido/ausente não pode gerar NaN (data inválida na query) — fallback seguro.
  return Number.isFinite(raw) && raw > 0 ? raw : 12;
}
const INACTIVE_CHAT_MONTHS = parseInactiveChatMonths();

/**
 * Rotina de retenção de dados (relatório LGPD item 3.7).
 *
 * Executa as exclusões automáticas por tempo que não dependem de ação do usuário:
 * 1. Registros expirados de `generated_content_cache` (campo `expiresAt`);
 * 2. Chats inativos há mais de `RETENTION_INACTIVE_CHAT_MONTHS` meses
 *    (12 por padrão; mensagens e usage são removidos em cascata pelo banco).
 */
export async function runRetentionCleanup(): Promise<CleanupResult> {
  const now = new Date();

  const { count: deletedExpiredCache } = await prisma.generatedContentCache.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  const inactiveSince = new Date(
    now.getTime() - INACTIVE_CHAT_MONTHS * 30 * 24 * 60 * 60 * 1000,
  );

  const oldChats = await prisma.chat.findMany({
    where: { updatedAt: { lt: inactiveSince } },
    select: { id: true },
  });
  let deletedInactiveChats = 0;
  if (oldChats.length > 0) {
    const { count } = await prisma.chat.deleteMany({
      where: { id: { in: oldChats.map((chat) => chat.id) } },
    });
    deletedInactiveChats = count;
  }

  return { deletedExpiredCache, deletedInactiveChats };
}
