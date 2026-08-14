import crypto from 'crypto';
import { redisClient } from '@/lib/infrastructure/redis/client';

/**
 * Cache global de expansão de queries (Redis + fallback em memória).
 * Global porque a expansão de uma query é igual para todos os usuários —
 * o cache de conteúdo da IA (generated-content-cache) é por usuário com FK
 * para User, inviável para usuários anônimos (não há linha de usuário).
 *
 * Fail-open: Redis indisponível → memória; memória vazia → miss (null).
 * Nunca lança — a expansão é otimização, não pode derrubar a busca.
 */

// Bump junto com QUERY_EXPANSION_PROMPT_VERSION para invalidar o cache global.
const KEY_PREFIX = 'query_expansion:v1:';
const TTL_SECONDS = 30 * 24 * 60 * 60;
const MEMORY_MAX_ENTRIES = 500;

const memoryCache = new Map<string, string[]>();

function cacheKey(canonical: string): string {
  return KEY_PREFIX + crypto.createHash('sha256').update(canonical).digest('hex');
}

/** Lê variantes cacheadas. Fail-open: Redis fora → memória; memória vazia → null. */
export async function getExpansion(canonical: string): Promise<string[] | null> {
  const memoryHit = memoryCache.get(canonical);
  if (memoryHit) return memoryHit;

  try {
    if (redisClient.status !== 'ready') return null;
    const raw = await redisClient.get(cacheKey(canonical));
    if (!raw) return null;
    const variants = JSON.parse(raw) as string[];
    return Array.isArray(variants) ? variants : null;
  } catch {
    return null;
  }
}

/** Grava variantes. Best-effort: nunca lança; Redis fora → memória. */
export async function setExpansion(canonical: string, variants: string[]): Promise<void> {
  memoryCache.set(canonical, variants);
  if (memoryCache.size > MEMORY_MAX_ENTRIES) {
    memoryCache.clear();
  }

  try {
    if (redisClient.status !== 'ready') return;
    await redisClient.set(cacheKey(canonical), JSON.stringify(variants), 'EX', TTL_SECONDS);
  } catch {
    // best-effort
  }
}