import type { Job } from '@/lib/types/job';

interface CacheEntry {
  jobs: Job[];
  staleAt: number;
  expiresAt: number;
}

export interface CacheResult {
  jobs: Job[] | null;
  isStale: boolean;
}

const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutos (stale: precisa de revalidação em segundo plano)
const DEFAULT_EXPIRES_MS = 30 * 60 * 1000; // 30 minutos (hard expiration: remove do cache)

export class PipelineCache {
  private store = new Map<string, CacheEntry>();

  constructor(
    private staleMs: number = DEFAULT_STALE_MS,
    private expiresMs: number = DEFAULT_EXPIRES_MS
  ) {}

  private makeKey(companies: string[], queries: string[]): string {
    const sortedCompanies = [...companies].map(c => c.trim().toLowerCase()).sort().join(',');
    const sortedQueries = [...queries].map(q => q.trim().toLowerCase()).sort().join(',');
    return `c:${sortedCompanies}|q:${sortedQueries}`;
  }

  get(companies: string[], queries: string[]): CacheResult {
    const key = this.makeKey(companies, queries);
    const entry = this.store.get(key);

    if (!entry) {
      return { jobs: null, isStale: true };
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.store.delete(key);
      return { jobs: null, isStale: true };
    }

    const isStale = now > entry.staleAt;
    return { jobs: entry.jobs, isStale };
  }

  set(companies: string[], queries: string[], jobs: Job[], customStaleMs?: number, customExpiresMs?: number): void {
    const key = this.makeKey(companies, queries);
    const now = Date.now();
    const staleTtl = customStaleMs ?? this.staleMs;
    const expiresTtl = customExpiresMs ?? this.expiresMs;

    this.store.set(key, {
      jobs,
      staleAt: now + staleTtl,
      expiresAt: now + expiresTtl,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export const pipelineCache = new PipelineCache();
