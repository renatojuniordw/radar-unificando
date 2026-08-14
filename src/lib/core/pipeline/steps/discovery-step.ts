import { companyDiscovery, type DiscoveredCompany } from '@/lib/core/discovery/company-discovery';
import { newCompanyRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';

export interface DiscoveryStepOptions {
  companies: string[];
  userId: string;
}

export async function runDiscoveryStep(runId: string, options: DiscoveryStepOptions): Promise<number> {
  const { companies, userId } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Discovery',
    message: 'Descobrindo novas empresas (Wayback + urlscan)...',
  });

  try {
    const discovered = await companyDiscovery.discover(companies);
    const fresh = await persistDiscovered(userId, discovered);

    if (fresh.length === 0) {
      progressEmitter.emit(runId, {
        type: 'step_complete', step: 'Discovery',
        message: 'Nenhuma nova empresa descoberta',
      });
      return 0;
    }

    progressEmitter.emit(runId, {
      type: 'step_complete', step: 'Discovery',
      message: `${fresh.length} novas empresas descobertas`,
    });

    return fresh.length;
  } catch (error) {
    progressEmitter.emit(runId, {
      type: 'step_warn', step: 'Discovery',
      message: `Discovery: ${error instanceof Error ? error.message : 'Falha'}`,
    });
    return 0;
  }
}

/** Persiste apenas empresas ainda não cadastradas do usuário; retorna as novas. */
async function persistDiscovered(userId: string, discovered: DiscoveredCompany[]): Promise<DiscoveredCompany[]> {
  if (discovered.length === 0) return [];
  const existing = await newCompanyRepository.findExisting(userId, discovered.map((d) => d.name));
  const fresh = discovered.filter((d) => !existing.has(d.name));
  await Promise.all(
    fresh.map((d) =>
      newCompanyRepository.create({ userId, name: d.name, careersUrl: d.careersUrl }),
    ),
  );
  return fresh;
}
