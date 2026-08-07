// ---------------------------------------------------------------------------
// Serviço reutilizável de filtro de vagas com link morto (404/410).
// Aplicado SOLID:
//  - ISP: interface LinkChecker mínima (quem filtra depende dela, não do HTTP)
//  - SRP: HttpLinkChecker só checa o status de UMA url; JobLinkFilter só filtra
//  - OCP/LSP: CachedLinkChecker embrulha qualquer LinkChecker sem mudar o filtro
//  - DIP: o filtro recebe o checker por injeção; a composição fica no singleton
// Uso: qualquer listagem de vagas (tabela, chat, futuras abas) chama
// `jobLinkFilter.filterAlive(jobs)`.
// ---------------------------------------------------------------------------

import { mapWithConcurrency } from '@/lib/core/pipeline/link-check';

const CHECK_TIMEOUT_MS = 8_000;

export interface LinkChecker {
  isDead(url: string): Promise<boolean>;
}

/** Fail-safe: só 404/410 contam como morto; timeout/erro/403 = vivo (nunca remove vaga por falso positivo). */
export class HttpLinkChecker implements LinkChecker {
  async isDead(url: string): Promise<boolean> {
    if (!url) return true;
    const status = await this.requestStatus(url, 'HEAD');
    if (status === 404 || status === 410) return true;
    if (status !== null) return false;
    const getStatus = await this.requestStatus(url, 'GET');
    return getStatus === 404 || getStatus === 410;
  }

  private async requestStatus(url: string, method: 'HEAD' | 'GET'): Promise<number | null> {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
      return res.status;
    } catch {
      return null;
    }
  }
}

/** Decorator de cache (em memória, TTL configurável) — evita rechecar a mesma vaga em abas/contextos. */
export class CachedLinkChecker implements LinkChecker {
  private cache = new Map<string, { dead: boolean; expiresAt: number }>();

  constructor(
    private readonly inner: LinkChecker,
    private readonly ttlMs = 60 * 60 * 1000,
  ) {}

  async isDead(url: string): Promise<boolean> {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.dead;
    const dead = await this.inner.isDead(url);
    this.cache.set(url, { dead, expiresAt: Date.now() + this.ttlMs });
    return dead;
  }
}

export interface JobWithLink {
  link: string;
}

export interface JobLinkFilterOptions {
  concurrency?: number;
}

export class JobLinkFilter {
  constructor(private readonly checker: LinkChecker) {}

  async filterAlive<T extends JobWithLink>(jobs: T[], opts: JobLinkFilterOptions = {}): Promise<T[]> {
    if (jobs.length === 0) return jobs;
    const concurrency = opts.concurrency ?? 5;
    const flags = await mapWithConcurrency(jobs, concurrency, async (job) => !(await this.checker.isDead(job.link)));
    return jobs.filter((_, i) => flags[i]);
  }
}

// Composição (root composition): singleton pronto para uso em qualquer contexto.
export const jobLinkFilter = new JobLinkFilter(new CachedLinkChecker(new HttpLinkChecker()));
