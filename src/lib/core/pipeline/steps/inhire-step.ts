import { inhireScraper } from '@/lib/core/scrapers/inhire-scraper';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { JobData } from '@/types';

export interface InHireStepOptions {
  companies: string[];
  queries?: string[];
}

export async function runInHireStep(runId: string, options: InHireStepOptions): Promise<JobData[]> {
  const { companies, queries } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'InHire',
    message: 'Buscando vagas na InHire...',
  });

  try {
    let jobs = await inhireScraper.searchJobs(companies.length > 0 ? companies : undefined);

    if (queries?.length) {
      const queryTerms = queries.map(q => q.toLowerCase().trim());
      jobs = jobs.filter(j => {
        const titulo = j.titulo_vaga.toLowerCase();
        return queryTerms.some(q => titulo.includes(q));
      });
    }

    const normalized = companies.map(c => c.toLowerCase().trim());
    const labeled = jobs.map(j => ({
      ...j,
      na_lista: normalized.some(c => j.empresa.toLowerCase().includes(c)) ? 'Sim' as const : 'Não' as const,
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
