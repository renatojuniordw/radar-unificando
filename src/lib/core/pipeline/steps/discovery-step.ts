import { companyDiscovery } from '@/lib/core/discovery/company-discovery';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';

export interface DiscoveryStepOptions {
  companies: string[];
}

export async function runDiscoveryStep(runId: string, options: DiscoveryStepOptions): Promise<number> {
  const { companies } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Discovery',
    message: 'Descobrindo novas empresas (Wayback + urlscan)...',
  });

  try {
    const discovered = await companyDiscovery.discover(companies);

    if (discovered.length === 0) {
      progressEmitter.emit(runId, {
        type: 'step_complete', step: 'Discovery',
        message: 'Nenhuma nova empresa descoberta',
      });
      return 0;
    }

    progressEmitter.emit(runId, {
      type: 'step_complete', step: 'Discovery',
      message: `${discovered.length} novas empresas descobertas`,
    });

    return discovered.length;
  } catch (error) {
    progressEmitter.emit(runId, {
      type: 'step_warn', step: 'Discovery',
      message: `Discovery: ${error instanceof Error ? error.message : 'Falha'}`,
    });
    return 0;
  }
}
