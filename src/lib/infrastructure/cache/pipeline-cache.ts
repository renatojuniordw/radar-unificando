import type { Job } from '@/lib/types/job';

interface CacheEntry {
  jobs: Job[];
  expiresAt: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutos

export class PipelineCache {
  private store = new Map<string, CacheEntry>();

  constructor(private ttlMs: number = DEFAULT_TTL_MS) {}

  private makeKey(companies: string[], queries: string[]): string {
    const sortedCompanies = [...companies].map(c => c.trim().toLowerCase()).sort().join(',');
    const sortedQueries = [...queries].map(q => q.trim().toLowerCase()).sort().join(',');
    return `c:${sortedCompanies}|q:${sortedQueries}`;
  }

  get(companies: string[], queries: string[]): Job[] | null {
    const key = this.makeKey(companies, queries);
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.jobs;
  }

  set(companies: string[], queries: string[], jobs: Job[], customTtlMs?: number): void {
    const key = this.makeKey(companies, queries);
    const ttl = customTtlMs ?? this.ttlMs;
    this.store.set(key, {
      jobs,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export const pipelineCache = new PipelineCache();
