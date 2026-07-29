import type { IPipelineStep, PipelineContext } from '../types';
import type { IJobRepository } from '@/lib/infrastructure/repositories/types';
import type { InhireGuessScraper } from '../../scrapers/inhire-guess';
import type { ProgressEvent } from '@/types';

export class ScrapeInhireGuessStep implements IPipelineStep {
  readonly name = 'InHire (lista própria)';

  constructor(
    private readonly inhireGuess: InhireGuessScraper,
    private readonly jobRepo: IJobRepository
  ) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    if (context.companies.length === 0) {
      onProgress({ type: 'step_complete', step: this.name, message: 'Nenhuma empresa na lista — pulando' });
      return;
    }

    const result = await this.inhireGuess.scrape({
      companies: context.companies,
      onProgress,
    });

    if (result.ok) {
      const count = await this.jobRepo.upsertJobs(result.value.jobs);
      context.stats.inhire_jobs = (context.stats.inhire_jobs || 0) + count;
    } else {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `InHire (lista): ${result.error.message}`,
      });
    }
  }
}