import type { ProgressEvent, PipelineStats } from '@/types';

export interface PipelineContext {
  runId: string;
  cancelled: boolean;
  companies: string[];
  discoveryEnabled: boolean;
  stats: PipelineStats;
  errors: Array<{ step: string; error: string }>;
}

export interface IPipelineStep {
  readonly name: string;
  execute(context: PipelineContext, onProgress: (event: ProgressEvent) => void): Promise<void>;
}
