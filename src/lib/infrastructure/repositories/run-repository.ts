import type Database from 'better-sqlite3';
import type { PipelineRun } from '@/types';
import type { IRunRepository } from './types';

export class RunRepository implements IRunRepository {
  constructor(private readonly db: Database.Database) {}

  create(id: string, discoveryEnabled: boolean): Promise<void> {
    this.db.prepare("INSERT INTO pipeline_runs (id, status, discovery_enabled) VALUES (?, 'pending', ?)").run(id, discoveryEnabled ? 1 : 0);
    return Promise.resolve();
  }

  update(id: string, data: Partial<PipelineRun>): Promise<void> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    if (data.status !== undefined) {
      fields.push('status = @status');
      params.status = data.status;
    }
    if (data.total_jobs !== undefined) {
      fields.push('total_jobs = @total_jobs');
      params.total_jobs = data.total_jobs;
    }
    if (data.gupy_jobs !== undefined) {
      fields.push('gupy_jobs = @gupy_jobs');
      params.gupy_jobs = data.gupy_jobs;
    }
    if (data.inhire_jobs !== undefined) {
      fields.push('inhire_jobs = @inhire_jobs');
      params.inhire_jobs = data.inhire_jobs;
    }
    if (data.new_companies_found !== undefined) {
      fields.push('new_companies_found = @new_companies_found');
      params.new_companies_found = data.new_companies_found;
    }

    if (data.status === 'running') {
      fields.push("started_at = datetime('now')");
    }
    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
      fields.push("finished_at = datetime('now')");
    }

    if (fields.length > 0) {
      this.db.prepare(`UPDATE pipeline_runs SET ${fields.join(', ')} WHERE id = @id`).run(params);
    }

    return Promise.resolve();
  }

  findById(id: string): Promise<PipelineRun | null> {
    const row = this.db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(id) as PipelineRun | undefined;
    return Promise.resolve(row || null);
  }

  findLatest(): Promise<PipelineRun | null> {
    const row = this.db.prepare('SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT 1').get() as PipelineRun | undefined;
    return Promise.resolve(row || null);
  }
}
