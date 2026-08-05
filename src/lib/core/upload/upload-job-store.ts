import type { ResumeExtractionResult } from '@/lib/core/parsing/resume-extraction-cache';

export type UploadJobStatus = 'processing' | 'completed' | 'failed';

export interface UploadJobResult extends ResumeExtractionResult {
  markdown: string;
  resumeText: string;
  count: number;
}

export interface UploadJob {
  id: string;
  userId: string;
  status: UploadJobStatus;
  result?: UploadJobResult;
  error?: string;
  createdAt: number;
}

const JOB_TTL_MS = 10 * 60 * 1000; // limpa jobs inativos após 10min
const CLEANUP_INTERVAL_MS = 60_000; // varredura a cada 1min

/**
 * Store in-memory de jobs de upload. Segue o mesmo padrão do
 * ProgressEmitter do pipeline: o POST cria o job e retorna na hora,
 * o processamento roda em background e o cliente faz polling do status.
 * In-memory é suficiente porque o app roda em container único (Docker).
 */
export class UploadJobStore {
  private jobs = new Map<string, UploadJob>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private ensureCleanup(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      (this.cleanupTimer as { unref(): void }).unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (now - job.createdAt > JOB_TTL_MS) {
        this.jobs.delete(id);
      }
    }
  }

  create(id: string, userId: string): UploadJob {
    this.ensureCleanup();
    const job: UploadJob = { id, userId, status: 'processing', createdAt: Date.now() };
    this.jobs.set(id, job);
    return job;
  }

  complete(id: string, result: UploadJobResult): UploadJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    job.status = 'completed';
    job.result = result;
    return job;
  }

  fail(id: string, error: string): UploadJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    job.status = 'failed';
    job.error = error;
    return job;
  }

  findById(id: string): UploadJob | undefined {
    return this.jobs.get(id);
  }
}

declare global {
  var __radar_upload_job_store__: UploadJobStore | undefined;
}

export const uploadJobStore: UploadJobStore =
  (globalThis.__radar_upload_job_store__ ??= new UploadJobStore());
