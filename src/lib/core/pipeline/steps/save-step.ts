import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { dedupEngine } from '@/lib/core/dedup';
import { jobRepository } from '@/lib/infrastructure/repositories';
import type { JobData } from '@/types';
import type { Prisma } from '@prisma/client';

export interface SaveStepOptions {
  userId: string;
  source: string;
}

export async function runSaveStep(runId: string, jobs: JobData[], options: SaveStepOptions): Promise<number> {
  const { userId, source } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Merge',
    message: `Salvando ${jobs.length} vagas...`,
  });

  const deduped = dedupEngine.dedupByLink(jobs).slice(0, 200);

  const data: Prisma.JobCreateManyInput[] = deduped.map(job => ({
    userId,
    source,
    empresa: job.empresa || 'Desconhecida',
    plataforma: job.plataforma,
    naLista: job.na_lista || 'Não',
    cargoCategoria: job.cargo_categoria,
    tituloVaga: job.titulo_vaga,
    tipo: job.tipo,
    local: job.local,
    link: job.link,
    nomeNaPlataforma: job.nome_na_plataforma,
    publicado: job.publicado,
    alerta: job.alerta || '',
  }));

  const inserted = await jobRepository.createMany(data);

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Merge',
    message: `${inserted} vagas salvas no banco (${deduped.length} únicas)`,
  });

  return inserted;
}
