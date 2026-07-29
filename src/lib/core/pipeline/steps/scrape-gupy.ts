import type { IPipelineStep, PipelineContext } from '../types';
import type { IJobRepository } from '@/lib/infrastructure/repositories/types';
import type { GupyScraper } from '../../scrapers/gupy-scraper';
import type { ProgressEvent } from '@/types';

export class ScrapeGupyStep implements IPipelineStep {
  readonly name = 'Gupy';

  constructor(
    private readonly gupyScraper: GupyScraper,
    private readonly jobRepo: IJobRepository
  ) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    const result = await this.gupyScraper.scrape({
      companies: context.companies,
      onProgress,
    });

    if (result.ok) {
      const count = await this.jobRepo.upsertJobs(result.value.jobs);
      context.stats.gupy_jobs = count;
    } else {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `Gupy: ${result.error.message}`,
      });
    }
  }
}