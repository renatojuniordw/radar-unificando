import type { JobData } from '@/types';

export class JobDeduper {
  deduplicate(jobs: JobData[]): JobData[] {
    const seen = new Set<string>();
    const out: JobData[] = [];

    for (const job of jobs) {
      const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const k1 = job.link || `${job.empresa}|${job.titulo_vaga}`;
      const k2 = `${norm(job.empresa)}|${norm(job.titulo_vaga)}|${job.plataforma}`;

      if (seen.has(k1) || seen.has(k2)) continue;
      seen.add(k1);
      seen.add(k2);
      out.push(job);
    }

    return out;
  }
}
