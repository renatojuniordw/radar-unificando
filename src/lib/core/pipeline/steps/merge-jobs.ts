import type { IPipelineStep, PipelineContext } from '../types';
import type { IJobRepository } from '@/lib/infrastructure/repositories/types';
import { JobDeduper } from '../../dedup/job-deduper';
import type { ProgressEvent } from '@/types';

export class MergeJobsStep implements IPipelineStep {
  readonly name = 'Merge + Dedup';

  constructor(
    private readonly jobRepo: IJobRepository,
    private readonly deduper: JobDeduper
  ) {}

  async execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void> {
    onProgress({ type: 'step_progress', step: this.name, message: 'Coletando vagas do banco...' });

    const allJobs = await this.jobRepo.findAll();

    onProgress({ type: 'step_progress', step: this.name, message: `Deduplicando ${allJobs.length} vagas...` });

    const deduped = this.deduper.deduplicate(allJobs);
    await this.jobRepo.replaceAll(deduped);

    const now = new Date().toLocaleDateString('sv-SE');
    await this.jobRepo.stampDetectionDates(now);

    const gupyCount = deduped.filter(j => j.plataforma === 'Gupy').length;
    const inhireCount = deduped.filter(j => j.plataforma === 'InHire').length;

    context.stats.total_jobs = deduped.length;
    context.stats.gupy_jobs = gupyCount;
    context.stats.inhire_jobs = inhireCount;

    onProgress({
      type: 'step_complete',
      step: this.name,
      message: `Gupy=${gupyCount} InHire=${inhireCount} Total=${deduped.length}`,
    });
  }
}