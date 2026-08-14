import { inhireScraper, type InHireScraper } from '@/lib/core/scrapers/inhire-scraper';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { filterFreshJobs } from '@/lib/core/pipeline/freshness';
import type { Job } from '@/types';

export interface InHireStepOptions {
  companies: string[];
  queries?: string[];
}

export interface InHireStepDeps {
  scraper?: Pick<InHireScraper, 'searchJobs'>;
}

export async function runInHireStep(runId: string, options: InHireStepOptions, deps: InHireStepDeps = {}): Promise<Job[]> {
  const { companies, queries } = options;
  const { scraper = inhireScraper } = deps;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'InHire',
    message: 'Buscando vagas na InHire...',
  });

  try {
    let jobs = await scraper.searchJobs(companies.length > 0 ? companies : undefined);

    if (queries?.length) {
      const queryTerms = queries.map(q => q.toLowerCase().trim());
      jobs = jobs.filter(j => {
        const title = j.title.toLowerCase();
        return queryTerms.some(q => title.includes(q));
      });
    }

    const normalized = companies.map(c => c.toLowerCase().trim());
    const labeled = jobs.map(j => ({
      ...j,
      onList: normalized.some(c => j.company.toLowerCase().includes(c)) ? 'Sim' as const : 'Não' as const,
    }));

    progressEmitter.emit(runId, {
      type: 'step_complete', step: 'InHire',
      message: `InHire: ${labeled.length} vagas encontradas`,
    });

    return filterFreshJobs(labeled);
  } catch (error) {
    progressEmitter.emit(runId, {
      type: 'step_warn', step: 'InHire',
      message: `InHire: ${error instanceof Error ? error.message : 'Falha ao buscar'}`,
    });
    return [];
  }
}
