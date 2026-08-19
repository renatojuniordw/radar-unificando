import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    generatedContentCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { computeCacheKey, getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';

describe('computeCacheKey', () => {
  it('should_be_deterministic_for_same_inputs', () => {
    const a = computeCacheKey('v1', ['Dev', 'vaga', ['React', 'Python']]);
    const b = computeCacheKey('v1', ['Dev', 'vaga', ['React', 'Python']]);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('should_sort_arrays_before_hashing', () => {
    const a = computeCacheKey('v1', ['Dev', ['React', 'Python']]);
    const b = computeCacheKey('v1', ['Dev', ['Python', 'React']]);
    expect(a).toBe(b);
  });

  it('should_differ_when_prompt_version_changes', () => {
    const a = computeCacheKey('v1', ['Dev']);
    const b = computeCacheKey('v2', ['Dev']);
    expect(a).not.toBe(b);
  });
});

describe('getCached', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_content_when_row_valid', async () => {
    vi.mocked(prisma.generatedContentCache.findUnique).mockResolvedValue({
      content: { letter: 'carta' },
      expiresAt: new Date(Date.now() + 1000),
    } as any);
    const result = await getCached('user-1', 'cover_letter', 'key');
    expect(result).toEqual({ letter: 'carta' });
    expect(prisma.generatedContentCache.findUnique).toHaveBeenCalledWith({
      where: { userId_kind_cacheKey: { userId: 'user-1', kind: 'cover_letter', cacheKey: 'key' } },
    });
  });

  it('should_return_null_when_row_expired', async () => {
    vi.mocked(prisma.generatedContentCache.findUnique).mockResolvedValue({
      content: { letter: 'carta' },
      expiresAt: new Date(Date.now() - 1000),
    } as any);
    expect(await getCached('user-1', 'cover_letter', 'key')).toBeNull();
  });

  it('should_return_null_when_row_missing', async () => {
    vi.mocked(prisma.generatedContentCache.findUnique).mockResolvedValue(null);
    expect(await getCached('user-1', 'cover_letter', 'key')).toBeNull();
  });
});

describe('saveToCache', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_upsert_without_job_id', async () => {
    vi.mocked(prisma.generatedContentCache.upsert).mockResolvedValue({} as any);
    await saveToCache('user-1', 'cover_letter', 'key', { letter: 'carta' });
    const call = vi.mocked(prisma.generatedContentCache.upsert).mock.calls[0];
    expect(call[0].where).toEqual({ userId_kind_cacheKey: { userId: 'user-1', kind: 'cover_letter', cacheKey: 'key' } });
    expect(call[0].create).toMatchObject({ userId: 'user-1', kind: 'cover_letter', cacheKey: 'key' });
    expect(call[0].create.jobId).toBeNull();
    expect(call[0].update).toBeDefined();
  });

  it('should_include_job_id_when_provided', async () => {
    vi.mocked(prisma.generatedContentCache.upsert).mockResolvedValue({} as any);
    await saveToCache('user-1', 'fit_analysis', 'key', { analysis: {} }, 'job-9');
    const create = vi.mocked(prisma.generatedContentCache.upsert).mock.calls[0][0].create as any;
    expect(create.jobId).toBe('job-9');
  });
});