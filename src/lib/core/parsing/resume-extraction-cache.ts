import { createHash } from 'node:crypto';

/**
 * Cache in-memory de extrações de currículo por hash do conteúdo.
 * Evita re-chamar a LLM quando o mesmo PDF/texto é enviado de novo
 * (ex: usuário re-upload do mesmo arquivo, ou o mesmo currículo em
 * dois navegadores). TTL de 1h + limite de entradas para não crescer
 * sem controle em instâncias de longa duração.
 */

interface CacheEntry {
  extractedAt: number;
  result: ResumeExtractionResult;
}

export interface ResumeExtractionResult {
  skills: string[];
  experienceYears: number | null;
  seniority: string | null;
  education: string[];
  currentRole: string | null;
  area: string | null;
  extractionError?: string | null;
}

const TTL_MS = 60 * 60 * 1000; // 1 hora
const MAX_ENTRIES = 200;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // varredura a cada 10min

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export class ResumeExtractionCache {
  private store = new Map<string, CacheEntry>();
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
    for (const [hash, entry] of this.store) {
      if (now - entry.extractedAt > TTL_MS) {
        this.store.delete(hash);
      }
    }
  }

  get(hash: string): ResumeExtractionResult | null {
    this.ensureCleanup();
    const entry = this.store.get(hash);
    if (!entry) return null;
    if (Date.now() - entry.extractedAt > TTL_MS) {
      this.store.delete(hash);
      return null;
    }
    return entry.result;
  }

  set(hash: string, result: ResumeExtractionResult): void {
    this.ensureCleanup();
    if (this.store.size >= MAX_ENTRIES) {
      // Remove a entrada mais antiga (Map preserva ordem de inserção)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(hash, { extractedAt: Date.now(), result });
  }
}

declare global {
  var __radar_resume_cache__: ResumeExtractionCache | undefined;
}

export const resumeExtractionCache: ResumeExtractionCache =
  (globalThis.__radar_resume_cache__ ??= new ResumeExtractionCache());
