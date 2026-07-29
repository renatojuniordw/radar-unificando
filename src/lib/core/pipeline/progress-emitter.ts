import type { ProgressEvent } from '@/types';

type ProgressListener = (event: ProgressEvent) => void;

const MAX_BUFFERED = 500;

export class ProgressEmitter {
  private listeners = new Map<string, Set<ProgressListener>>();
  private buffers = new Map<string, ProgressEvent[]>();

  on(runId: string, listener: ProgressListener): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);

    const buffer = this.buffers.get(runId);
    if (buffer) {
      for (const event of buffer) {
        listener(event);
      }
      this.buffers.delete(runId);
    }

    return () => {
      this.listeners.get(runId)?.delete(listener);
      if (this.listeners.get(runId)?.size === 0) {
        this.listeners.delete(runId);
        this.buffers.delete(runId);
      }
    };
  }

  emit(runId: string, event: ProgressEvent): void {
    const listeners = this.listeners.get(runId);
    if (listeners && listeners.size > 0) {
      for (const listener of listeners) {
        listener(event);
      }
    } else {
      if (!this.buffers.has(runId)) {
        this.buffers.set(runId, []);
      }
      const buffer = this.buffers.get(runId)!;
      if (buffer.length < MAX_BUFFERED) {
        buffer.push(event);
      }
    }
  }

  removeAll(runId: string): void {
    this.listeners.delete(runId);
    this.buffers.delete(runId);
  }
}

export const progressEmitter = new ProgressEmitter();
