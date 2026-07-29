import type { JobData } from '@/types';

export class DedupEngine {
  dedupByLink(jobs: JobData[]): JobData[] {
    const seen = new Map<string, JobData>();
    for (const job of jobs) {
      const key = job.link || `${job.empresa}-${job.titulo_vaga}`;
      if (!seen.has(key)) {
        seen.set(key, job);
      }
    }
    return Array.from(seen.values());
  }

  dedupByTitleAndCompany(jobs: JobData[]): JobData[] {
    const seen = new Map<string, JobData>();
    for (const job of jobs) {
      const key = `${(job.empresa || '').toLowerCase().trim()}|${(job.titulo_vaga || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.set(key, job);
      }
    }
    return Array.from(seen.values());
  }

  mergeSources(existing: JobData[], incoming: JobData[]): JobData[] {
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
