import type { IPipelineStep, PipelineContext } from '../types';
import type { IPresenceRepository, IJobRepository } from '@/lib/infrastructure/repositories/types';
import type { GupyPresenceScraper } from '../../scrapers/gupy-presence';
import type { ProgressEvent } from '@/types';

export class BuildPresenceStep implements IPipelineStep {
  readonly name = 'Presença por empresa';

  constructor(
    private readonly gupyPresence: GupyPresenceScraper,
    private readonly presenceRepo: IPresenceRepository,
    private readonly jobRepo: IJobRepository
  ) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    if (context.companies.length === 0) {
      onProgress({ type: 'step_complete', step: this.name, message: 'Nenhuma empresa na lista — pulando' });
      return;
    }

    const result = await this.gupyPresence.checkPresence(context.companies, onProgress);

    if (result.ok) {
      const inhireTenants = await this.jobRepo.getInhireTenantsForCompanies(context.companies);
      await this.presenceRepo.buildPresence(context.companies, result.value, inhireTenants);

      const both = result.value.filter(g =>
        inhireTenants.some(i => i.empresa === g.empresa)
      );

      onProgress({
        type: 'step_complete',
        step: this.name,
        message: `Gupy=${result.value.length} InHire=${inhireTenants.length} Ambas=${both.length}`,
      });
    } else {
      onProgress({
        type: 'step_warn',
        step: this.name,
        message: `Presença: ${result.error.message}`,
      });
    }
  }
}