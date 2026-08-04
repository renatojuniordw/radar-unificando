import { jobRepository } from '@/lib/infrastructure/repositories';
import { isLinkDead, mapWithConcurrency } from '@/lib/core/pipeline/link-check';

const REVALIDATE_BATCH_SIZE = 300;
const REVALIDATE_CONCURRENCY = 10;

/**
 * Re-checks previously saved jobs whose link hasn't been verified in a
 * while, marking the ones that now 404/410 on the source site as
 * 'inactive' so they stop showing up for users. Runs against the oldest
 * `lastCheckedAt` batch each time so, over repeated runs, the whole active
 * set eventually gets covered.
 */
export async function revalidateJobs(): Promise<{ checked: number; deactivated: number }> {
  const jobs = await jobRepository.findStaleForRevalidation(REVALIDATE_BATCH_SIZE);
  if (jobs.length === 0) return { checked: 0, deactivated: 0 };

  const deadFlags = await mapWithConcurrency(jobs, REVALIDATE_CONCURRENCY, job => isLinkDead(job.link));

  const deadIds = jobs.filter((_, i) => deadFlags[i]).map(j => j.id);
  const aliveIds = jobs.filter((_, i) => !deadFlags[i]).map(j => j.id);

  await Promise.all([
    jobRepository.markStatus(deadIds, 'inactive'),
    jobRepository.touchLastChecked(aliveIds),
  ]);

  return { checked: jobs.length, deactivated: deadIds.length };
}
