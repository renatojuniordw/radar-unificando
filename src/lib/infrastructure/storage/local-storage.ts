import type { JobData, PipelineRun, PipelineStats } from '@/types';

const STORAGE_KEYS = {
  VAGAS: 'ru_anon_vagas',
  COMPANIES: 'ru_anon_companies',
  RUN: 'ru_anon_run',
  STATS: 'ru_anon_stats',
} as const;

export const AnonymousStorage = {
  getVagas(): JobData[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAGAS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setVagas(vagas: JobData[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.VAGAS, JSON.stringify(vagas));
    } catch { /* quota exceeded */ }
  },

  addVagas(vagas: JobData[]): void {
    const existing = this.getVagas();
    const existingLinks = new Set(existing.map(v => v.link));
    const newVagas = vagas.filter(v => !existingLinks.has(v.link));
    this.setVagas([...existing, ...newVagas]);
  },

  getCompanies(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setCompanies(companies: string[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    } catch { /* quota exceeded */ }
  },

  getRun(): PipelineRun | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RUN);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setRun(run: PipelineRun): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.RUN, JSON.stringify(run));
    } catch { /* quota exceeded */ }
  },

  getStats(): PipelineStats {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  setStats(stats: PipelineStats): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch { /* quota exceeded */ }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });
  },
};
