import { publicJobRepository } from '@/lib/infrastructure/repositories';
import type { Job } from '@/types';

/**
 * Atualiza o pool público de vagas (SEO). Roda em toda execução do pipeline,
 * logada ou anônima. Falha aberta: erros aqui não devem derrubar a busca.
 */
export async function runPublicSaveStep(jobs: Job[]): Promise<number> {
  if (jobs.length === 0) return 0;
  try {
    return await publicJobRepository.upsertMany(jobs);
  } catch (error) {
    console.error('[public-save] Erro ao atualizar pool público de vagas:', error);
    return 0;
  }
}
