export type { Job, Platform } from '@/lib/types/job';
import type { Job } from '@/lib/types/job';

export type ProgressEventType = 'step_start' | 'step_progress' | 'step_complete' | 'step_warn' | 'step_error' | 'pipeline_complete' | 'pipeline_error' | 'pipeline_cancelled';

export interface ProgressEvent {
  type: ProgressEventType;
  step?: string;
  message?: string;
  detail?: string;
  current?: number;
  total?: number;
  error?: string;
  jobs?: Job[];
}
