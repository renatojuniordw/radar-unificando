import { inhireScraper } from '@/lib/core/scrapers/inhire-scraper';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { JobData } from '@/types';

export interface InHireStepOptions {
  companies: string[];
}

export async function runInHireStep(runId: string, options: InHireStepOptions): Promise<JobData[]> {
  const { companies } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'InHire',
    message: 'Buscando vagas na InHire...',
  });

  try {
    const jobs = await inhireScraper.searchJobs(companies.length > 0 ? companies : undefined);

    const labeled = jobs.map(j => ({
      ...j,
      na_lista: companies.includes(j.empresa) ? 'Sim' as const : 'Não' as const,
    }));

    progressEmitter.emit(runId, {
      type: 'step_complete', step: 'InHire',
      message: `InHire: ${labeled.length} vagas encontradas`,
    });

    return labeled;
  } catch (error) {
    progressEmitter.emit(runId, {
      type: 'step_warn', step: 'InHire',
      message: `InHire: ${error instanceof Error ? error.message : 'Falha ao buscar'}`,
    });
    return [];
  }
}
