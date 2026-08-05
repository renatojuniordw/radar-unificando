import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { dedupEngine } from '@/lib/core/dedup';
import { jobRepository } from '@/lib/infrastructure/repositories';
import { isLinkDead, mapWithConcurrency } from '@/lib/core/pipeline/link-check';
import type { Job } from '@/types';
import type { Prisma } from '@prisma/client';

export interface SaveStepOptions {
  userId: string;
  source: string;
}

export interface SaveStepDeps {
  jobRepository?: Pick<typeof jobRepository, 'findExistingLinks' | 'createMany'>;
}

const LINK_CHECK_CONCURRENCY = 10;

export async function runSaveStep(runId: string, jobs: Job[], options: SaveStepOptions, deps: SaveStepDeps = {}): Promise<number> {
  const { userId, source } = options;
  const { jobRepository: repo = jobRepository } = deps;

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Merge',
    message: `Salvando ${jobs.length} vagas...`,
  });

  const deduped = dedupEngine.dedupByLink(jobs).slice(0, 200);

  // Only check links Gupy/InHire returned for jobs we haven't stored yet —
  // already-saved jobs are periodically re-checked by the revalidation job,
  // so re-validating them here would just slow down every pipeline run.
  const existingLinks = await repo.findExistingLinks(userId, deduped.map(j => j.link));
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
    company: job.company || 'Desconhecida',
    platform: job.platform,
    onList: job.onList || 'Não',
    roleCategory: job.roleCategory,
    title: job.title,
    type: job.type,
    location: job.location,
    link: job.link,
    companyNameOnPlatform: job.companyNameOnPlatform,
    postedAt: job.postedAt,
    alert: job.alert || '',
    detectedAt: new Date().toISOString(),
    lastCheckedAt: new Date(),
  }));

  const inserted = await repo.createMany(data);

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Merge',
    message: `${inserted} vagas salvas no banco (${deduped.length} únicas)`,
  });

  return inserted;
}
