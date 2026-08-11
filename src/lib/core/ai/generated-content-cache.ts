import crypto from 'crypto';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

export type CachedContentKind =
  | 'fit_analysis'
  | 'cover_letter'
  | 'interview_questions'
  | 'skill_suggestions'
  | 'ats_analysis'
  | 'resume_adaptation';

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function computeCacheKey(promptVersion: string, parts: (string | number | string[])[]): string {
  const normalized = parts
    .map((p) => (Array.isArray(p) ? [...p].sort().join(',') : String(p)))
    .join('|');
  return crypto.createHash('sha256').update(`${promptVersion}|${normalized}`).digest('hex');
}

export async function getCached<T>(userId: string, kind: CachedContentKind, cacheKey: string): Promise<T | null> {
  const row = await prisma.generatedContentCache.findUnique({
    where: { userId_kind_cacheKey: { userId, kind, cacheKey } },
  });
  if (!row || row.expiresAt < new Date()) return null;
  return row.content as T;
}

export async function saveToCache(
  userId: string,
  kind: CachedContentKind,
  cacheKey: string,
  content: unknown,
  jobId?: string | null,
): Promise<void> {
  await prisma.generatedContentCache.upsert({
    where: { userId_kind_cacheKey: { userId, kind, cacheKey } },
    create: {
      userId,
      kind,
      cacheKey,
      jobId: jobId ?? null,
      content: content as object,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
    update: {
      content: content as object,
      jobId: jobId ?? null,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
}
