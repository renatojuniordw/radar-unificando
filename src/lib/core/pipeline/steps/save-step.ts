import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { dedupEngine } from '@/lib/core/dedup';
import type { JobData } from '@/types';

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
  let inserted = 0;

  for (const job of deduped) {
    try {
      await prisma.job.create({
        data: {
          userId,
          source,
          empresa: job.empresa || 'Desconhecida',
          plataforma: job.plataforma,
          naLista: job.na_lista,
          cargoCategoria: job.cargo_categoria,
          tituloVaga: job.titulo_vaga,
          tipo: job.tipo,
          local: job.local,
          link: job.link,
          nomeNaPlataforma: job.nome_na_plataforma,
          publicado: job.publicado,
          alerta: job.alerta || '',
        },
      });
      inserted++;
    } catch {
      // Duplicate, skip
    }
  }

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Merge',
    message: `${inserted} vagas salvas no banco (${deduped.length} únicas)`,
  });

  return inserted;
}
