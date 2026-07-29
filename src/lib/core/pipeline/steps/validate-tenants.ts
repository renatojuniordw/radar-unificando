import type { IPipelineStep, PipelineContext } from '../types';
import type { InhireScraper } from '../../scrapers/inhire-scraper';
import type { ProgressEvent } from '@/types';

export class ValidateTenantsStep implements IPipelineStep {
  readonly name = '[Discovery] Validar slugs InHire';

  constructor(private readonly inhireScraper: InhireScraper) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    const slugs = context.stats.new_companies_found
      ? await this.loadSlugs()
      : [];

    if (slugs.length === 0) {
      onProgress({ type: 'step_complete', step: this.name, message: 'Nenhum slug para validar' });
      return;
    }

    const result = await this.inhireScraper.validateTenants(slugs, context.companies, onProgress);
    if (!result.ok) {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `Validação: ${result.error.message}`,
      });
    }
  }

  private async loadSlugs(): Promise<string[]> {
    return [];
  }
}