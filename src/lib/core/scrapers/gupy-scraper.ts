import type { JobData, ProgressEvent } from '@/types';
import type { IScraper, Result, ScrapeParams, ScrapeResult } from './types';
import { config } from '@/config';
import { RoleMatcher } from '../matching/role-matcher';
import { CompanyMatcher } from '../matching/company-matcher';
import { textUtils } from '../matching/text-utils';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface GupyApiJob {
  id: number;
  name: string;
  careerPageName: string;
  careerPageUrl: string;
  workplaceType: string;
  isRemoteWork: boolean;
  city: string;
  state: string;
  country: string;
  jobUrl: string;
  publishedDate: string;
}

interface GupyApiResponse {
  data: GupyApiJob[];
}

export class GupyScraper implements IScraper {
  readonly platform = 'Gupy' as const;

  constructor(
    private readonly roleMatcher: RoleMatcher,
    private readonly companyMatcher: CompanyMatcher
  ) {}

  async scrape(params: ScrapeParams): Promise<Result<ScrapeResult>> {
    try {
      const { companies, onProgress } = params;

      const listCompact = companies
        .map(c => ({ orig: c, c: textUtils.compact(c) }))
        .filter(x => x.c.length >= 2);

      const matchCompany = (careerPageName: string): string | null => {
        const cp = textUtils.compact(careerPageName);
        if (!cp) return null;
        let hit = listCompact.find(x => x.c === cp);
        if (hit) return hit.orig;
        hit = listCompact.find(x =>
          (x.c.length >= 5 && cp.includes(x.c)) ||
          (cp.length >= 5 && x.c.includes(cp))
        );
        return hit ? hit.orig : null;
      };

      const fetchPage = async (q: string, offset: number, limit: number): Promise<GupyApiResponse> => {
        const url = `${config.gupy.apiUrl}?jobName=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${q}@${offset}`);
        return res.json();
      };

      const fetchAll = async (q: string): Promise<{ total: number; jobs: GupyApiJob[] }> => {
        const limit = config.gupy.pageSize;
        const MAX_OFFSET = config.gupy.maxOffset;
        let offset = 0;
        const out: GupyApiJob[] = [];

        while (offset <= MAX_OFFSET) {
          let json: GupyApiResponse | null = null;
          for (let attempt = 0; attempt < config.gupy.retriesPerPage; attempt++) {
            try {
              json = await fetchPage(q, offset, limit);
              break;
            } catch (e) {
              if (attempt === config.gupy.retriesPerPage - 1) throw e;
              await sleep(config.gupy.retryDelay);
            }
          }
          const data = json!.data || [];
          out.push(...data);
          if (data.length < limit) break;
          offset += limit;
          await sleep(config.gupy.delayBetweenPages);
        }

        return { total: out.length, jobs: out };
      };

      const byId = new Map<number, GupyApiJob>();
      for (const q of config.gupy.queries) {
        onProgress({ type: 'step_progress', step: 'Gupy', message: `Buscando "${q}"...` });
        const { total, jobs } = await fetchAll(q);
        for (const j of jobs) byId.set(j.id, j);
        onProgress({ type: 'step_progress', step: 'Gupy', message: `"${q}": ${total} vagas (${byId.size} únicas acumuladas)` });
      }

      const results: JobData[] = [];
      let inList = 0;
      let outList = 0;

      for (const j of byId.values()) {
        const role = this.roleMatcher.match(j.name);
        if (!role) continue;

        const w = String(j.workplaceType || '').toLowerCase();
        const isRemote = j.isRemoteWork === true || w.includes('remote') || w.includes('remoto');
        if (!isRemote) continue;

        const company = matchCompany(j.careerPageName);
        if (company) inList++;
        else outList++;

        results.push({
          empresa: company || j.careerPageName,
          plataforma: 'Gupy',
          na_lista: company ? 'Sim' : 'Não',
          cargo_categoria: role,
          titulo_vaga: j.name,
          tipo: j.workplaceType,
          local: [j.city, j.state, j.country].filter(Boolean).join(' / '),
          link: j.jobUrl || j.careerPageUrl || '',
          nome_na_plataforma: j.careerPageName,
          publicado: j.publishedDate || '',
          alerta: this.companyMatcher.alerta(j.name, [j.city, j.state, j.country].filter(Boolean).join(' / ')),
        });
      }

      onProgress({ type: 'step_complete', step: 'Gupy', message: `${results.length} vagas (lista=${inList}, fora=${outList})` });

      return { ok: true, value: { platform: 'Gupy', jobs: results } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }
}
