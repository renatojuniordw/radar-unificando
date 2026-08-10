import type { Job } from '@/types';

export class DedupEngine {
  dedupByLink(jobs: Job[]): Job[] {
    const seen = new Map<string, Job>();
    for (const job of jobs) {
      const key = job.link || `${job.company}-${job.title}`;
      if (!seen.has(key)) {
        seen.set(key, job);
      }
    }
    return Array.from(seen.values());
  }

  mergeSources(existing: Job[], incoming: Job[]): Job[] {
    const merged = [...existing];
    const existingLinks = new Set(existing.map(j => j.link));

    for (const job of incoming) {
      if (!existingLinks.has(job.link)) {
        merged.push(job);
        existingLinks.add(job.link);
      }
    }

    return merged;
  }
}

export const dedupEngine = new DedupEngine();
