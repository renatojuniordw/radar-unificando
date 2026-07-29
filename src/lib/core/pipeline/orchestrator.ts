import type { ProgressEvent, RunStatus } from '@/types';
import type { IPipelineStep, PipelineContext } from './types';
import { ProgressEmitter } from './progress-emitter';
import { config } from '@/config';
import type { IRunRepository } from '@/lib/infrastructure/repositories/types';

export class PipelineOrchestrator {
  private runs = new Map<string, PipelineContext>();

  constructor(
    private readonly steps: IPipelineStep[],
    private readonly runRepo: IRunRepository,
    private readonly progressEmitter: ProgressEmitter
  ) {}

  async start(runId: string, companies: string[], discoveryEnabled: boolean): Promise<void> {
    const context: PipelineContext = {
      runId,
      cancelled: false,
      companies,
      discoveryEnabled,
      stats: {},
      errors: [],
    };

    this.runs.set(runId, context);
    await this.runRepo.update(runId, { status: 'running' });

    const timeout = setTimeout(() => {
      context.cancelled = true;
      this.progressEmitter.emit(runId, {
        type: 'pipeline_error',
        message: 'Pipeline excedeu o tempo limite',
      });
    }, config.pipeline.maxRunTime);

    const relevantSteps = this.steps.filter(step => {
      if (step.name.startsWith('[Discovery]') && !discoveryEnabled) return false;
      return true;
    });

    for (const step of relevantSteps) {
      if (context.cancelled) {
        this.progressEmitter.emit(runId, {
          type: 'pipeline_cancelled',
          message: 'Pipeline cancelado',
        });
        await this.runRepo.update(runId, { status: 'cancelled' });
        clearTimeout(timeout);
        this.runs.delete(runId);
        return;
      }

      this.progressEmitter.emit(runId, {
        type: 'step_start',
        step: step.name,
        message: `Iniciando: ${step.name}`,
      });

      try {
        await step.execute(context, (event) => {
          this.progressEmitter.emit(runId, event);
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        context.errors.push({ step: step.name, error: msg });
        this.progressEmitter.emit(runId, {
          type: 'step_error',
          step: step.name,
          error: msg,
          message: `Falha: ${step.name} — ${msg}`,
        });
      }
    }

    clearTimeout(timeout);

    if (!context.cancelled) {
      const status: RunStatus = context.errors.length > 1 ? 'completed' : 'completed';
      await this.runRepo.update(runId, {
        status,
        ...context.stats,
      });

      this.progressEmitter.emit(runId, {
        type: 'pipeline_complete',
        message: `Pipeline concluído! ${context.stats.total_jobs || 0} vagas encontradas.`,
      });
    }

    this.runs.delete(runId);
  }

  cancel(runId: string): void {
    const context = this.runs.get(runId);
    if (context) {
      context.cancelled = true;
    }
  }

  getContext(runId: string): PipelineContext | undefined {
    return this.runs.get(runId);
  }
}