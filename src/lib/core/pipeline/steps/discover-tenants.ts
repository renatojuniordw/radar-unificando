import type { IPipelineStep, PipelineContext } from '../types';
import type { InhireDiscovery } from '../../scrapers/inhire-discovery';
import type { ProgressEvent } from '@/types';

export class DiscoverTenantsStep implements IPipelineStep {
  readonly name = '[Discovery] Coletar slugs InHire';

  constructor(private readonly discovery: InhireDiscovery) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    const result = await this.discovery.discover(onProgress);

    if (result.ok) {
      context.stats.new_companies_found = result.value.length;
    } else {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `Discovery: ${result.error.message}`,
      });
    }
  }
}