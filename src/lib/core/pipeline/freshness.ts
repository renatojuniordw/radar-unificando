import type { Job } from '@/types';

/** Vagas publicadas há mais de MAX_JOB_AGE_DAYS são consideradas antigas e descartadas. */
export const MAX_JOB_AGE_DAYS = 20;

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True quando a vaga é recente (ou não tem data — fail-open, não descarta). */
export function isFreshJob(job: Pick<Job, 'postedAt'>, maxAgeDays = MAX_JOB_AGE_DAYS): boolean {
  const posted = parseDate(job.postedAt);
  if (!posted) return true;
  const ageDays = (Date.now() - posted.getTime()) / (24 * 60 * 60 * 1000);
  return ageDays <= maxAgeDays;
}

/** Mantém apenas vagas publicadas dentro da janela de frescor. */
export function filterFreshJobs(jobs: Job[], maxAgeDays = MAX_JOB_AGE_DAYS): Job[] {
  return jobs.filter((job) => isFreshJob(job, maxAgeDays));
}