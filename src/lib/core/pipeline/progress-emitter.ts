import type { ProgressEvent } from '@/types';
import { debugLog } from '@/lib/utils/debug';

type ProgressListener = (event: ProgressEvent) => void;

const MAX_BUFFERED = 500;
const RUN_TTL_MS = 10 * 60 * 1000; // limpa runs inativas após 10min
const CLEANUP_INTERVAL_MS = 60_000; // varredura a cada 1min

export class ProgressEmitter {
  private listeners = new Map<string, Set<ProgressListener>>();
  private buffers = new Map<string, ProgressEvent[]>();
  private runTimestamps = new Map<string, number>();
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
    for (const [runId, ts] of this.runTimestamps) {
      if (now - ts > RUN_TTL_MS) {
        this.listeners.delete(runId);
        this.buffers.delete(runId);
        this.runTimestamps.delete(runId);
      }
    }
  }

  on(runId: string, listener: ProgressListener): () => void {
    this.ensureCleanup();
    this.runTimestamps.set(runId, Date.now());

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
        this.runTimestamps.delete(runId);
      }
    };
  }

  emit(runId: string, event: ProgressEvent): void {
    const prefix = `[pipeline ${runId.slice(0, 8)}]`;
    const label = event.step ? `${event.type}:${event.step}` : event.type;
    if (event.type === 'step_error' || event.type === 'pipeline_error') {
      console.error(prefix, label, '-', event.message || event.error);
    } else {
      debugLog(prefix, label, '-', event.message);
    }

    this.runTimestamps.set(runId, Date.now());

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
    this.runTimestamps.delete(runId);
  }
}

declare global {
  var __radar_progress_emitter__: ProgressEmitter | undefined;
}

export const progressEmitter: ProgressEmitter =
  (globalThis.__radar_progress_emitter__ ??= new ProgressEmitter());
