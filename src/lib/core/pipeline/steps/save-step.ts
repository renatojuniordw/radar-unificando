import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { dedupEngine } from '@/lib/core/dedup';
import { jobRepository } from '@/lib/infrastructure/repositories';
import { isLinkDead, mapWithConcurrency } from '@/lib/core/pipeline/link-check';
import type { JobData } from '@/types';
import type { Prisma } from '@prisma/client';

export interface SaveStepOptions {
  userId: string;
  source: string;
}

const LINK_CHECK_CONCURRENCY = 10;

export async function runSaveStep(runId: string, jobs: JobData[], options: SaveStepOptions): Promise<number> {
  const { userId, source } = options;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Merge',
    message: `Salvando ${jobs.length} vagas...`,
  });

  const deduped = dedupEngine.dedupByLink(jobs).slice(0, 200);

  // Only check links Gupy/InHire returned for jobs we haven't stored yet —
  // already-saved jobs are periodically re-checked by the revalidation job,
  // so re-validating them here would just slow down every pipeline run.
  const existingLinks = await jobRepository.findExistingLinks(userId, deduped.map(j => j.link));
  const candidates = deduped.filter(job => !existingLinks.has(job.link));
  const aliveFlags = await mapWithConcurrency(candidates, LINK_CHECK_CONCURRENCY, async job => !(await isLinkDead(job.link)));
  const deadLinks = new Set(candidates.filter((_, i) => !aliveFlags[i]).map(j => j.link));

  const alive = deduped.filter(job => !deadLinks.has(job.link));
  if (deadLinks.size > 0) {
    progressEmitter.emit(runId, {
      type: 'step_warn', step: 'Merge',
      message: `${deadLinks.size} vaga(s) descartada(s): link já indisponível na Gupy`,
    });
  }

  const data: Prisma.JobCreateManyInput[] = alive.map(job => ({
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
    detectadoEm: new Date().toISOString(),
    lastCheckedAt: new Date(),
  }));

  const inserted = await jobRepository.createMany(data);

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Merge',
    message: `${inserted} vagas salvas no banco (${deduped.length} únicas)`,
  });

  return inserted;
}
