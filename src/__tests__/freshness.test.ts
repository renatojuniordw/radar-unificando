import { describe, it, expect } from 'vitest';
import { isFreshJob, filterFreshJobs, MAX_JOB_AGE_DAYS } from '@/lib/core/pipeline/freshness';
import type { Job } from '@/types';

const mockJob = (postedAt: string): Job => ({
  company: 'Co',
  platform: 'Gupy',
  onList: 'Não',
  roleCategory: '',
  title: 'Vaga',
  type: 'Remoto',
  location: 'Remote',
  link: 'https://gupy.io/job/1',
  companyNameOnPlatform: 'Co',
  postedAt,
  alert: '',
});

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('isFreshJob', () => {
  it('considera_vaga_recente_como_fresca', () => {
    expect(isFreshJob(mockJob(new Date().toISOString()))).toBe(true);
    expect(isFreshJob(mockJob(daysAgo(MAX_JOB_AGE_DAYS)))).toBe(true);
  });

  it('considera_vaga_antiga_como_nao_fresca', () => {
    expect(isFreshJob(mockJob(daysAgo(MAX_JOB_AGE_DAYS + 1)))).toBe(false);
  });

  it('mantem_vaga_sem_data_ou_com_data_invalida_fail_open', () => {
    expect(isFreshJob(mockJob(''))).toBe(true);
    expect(isFreshJob(mockJob('data-invalida'))).toBe(true);
  });
});

describe('filterFreshJobs', () => {
  it('descarta_apenas_vagas_antigas', () => {
    const jobs = [mockJob(daysAgo(5)), mockJob(daysAgo(40))];

    const result = filterFreshJobs(jobs);

    expect(result.length).toBe(1);
    expect(result[0].postedAt).toBe(jobs[0].postedAt);
  });
});