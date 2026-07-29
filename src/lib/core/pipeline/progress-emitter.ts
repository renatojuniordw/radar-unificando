import type { ProgressEvent } from '@/types';

type ProgressListener = (event: ProgressEvent) => void;

export class ProgressEmitter {
  private listeners = new Map<string, Set<ProgressListener>>();

  on(runId: string, listener: ProgressListener): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);

    return () => {
      this.listeners.get(runId)?.delete(listener);
      if (this.listeners.get(runId)?.size === 0) {
        this.listeners.delete(runId);
      }
    };
  }

  emit(runId: string, event: ProgressEvent): void {
    const listeners = this.listeners.get(runId);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  removeAll(runId: string): void {
    this.listeners.delete(runId);
  }
}

export const progressEmitter = new ProgressEmitter();
