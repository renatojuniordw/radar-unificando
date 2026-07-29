import type { IPipelineStep, PipelineContext } from '../types';
import type { IJobRepository, INewCompanyRepository } from '@/lib/infrastructure/repositories/types';
import type { InhireScraper } from '../../scrapers/inhire-scraper';
import type { ProgressEvent } from '@/types';

export class ScrapeInhireAllStep implements IPipelineStep {
  readonly name = '[Discovery] Scrape todas vagas InHire';

  constructor(
    private readonly inhireScraper: InhireScraper,
    private readonly jobRepo: IJobRepository,
    private readonly newCompanyRepo: INewCompanyRepository
  ) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    const tenants = await this.loadValidatedTenants();
    if (tenants.length === 0) {
      onProgress({ type: 'step_complete', step: this.name, message: 'Nenhum tenant para processar' });
      return;
    }

    const result = await this.inhireScraper.scrapeAll(tenants, context.companies, onProgress);

    if (result.ok) {
      const count = await this.jobRepo.upsertJobs(result.value.jobs);
      context.stats.inhire_jobs = (context.stats.inhire_jobs || 0) + count;
      await this.newCompanyRepo.replaceAll(result.value.newCompanies);
    } else {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `Scrape InHire: ${result.error.message}`,
      });
    }
  }

  private async loadValidatedTenants() {
    return [];
  }
}