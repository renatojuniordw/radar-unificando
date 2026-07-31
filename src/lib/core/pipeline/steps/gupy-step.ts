import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { JobData } from '@/types';

export interface GupyStepOptions {
  companies: string[];
  isLoggedIn: boolean;
  queries?: string[];
}

export async function runGupyStep(runId: string, options: GupyStepOptions): Promise<JobData[]> {
  const { companies, isLoggedIn, queries = [] } = options;
  const jobs: JobData[] = [];

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Gupy',
    message: `Buscando vagas na Gupy...`,
  });

  const hasQueries = queries.length > 0;

  if (isLoggedIn && hasQueries) {
    try {
      for (let i = 0; i < queries.length; i++) {
        progressEmitter.emit(runId, {
          type: 'step_progress', step: 'Gupy',
          current: i + 1, total: queries.length,
          message: `Gupy MCP (${i + 1}/${queries.length}): ${queries[i]}`,
        });
        const result = await gupyMcpClient.searchJobs(queries[i], 500);
        jobs.push(...filterByCompany(result, companies));
      }
      progressEmitter.emit(runId, {
        type: 'step_complete', step: 'Gupy',
        message: `Gupy MCP: ${jobs.length} vagas encontradas`,
      });
    } catch {
      progressEmitter.emit(runId, {
        type: 'step_warn', step: 'Gupy',
        message: 'MCP falhou, usando fallback REST...',
      });
      const restJobs = await scrapeGupyRest(runId, companies, queries);
      jobs.push(...restJobs);
    }
  } else {
    const restJobs = await scrapeGupyRest(runId, companies, queries);
    jobs.push(...restJobs);
  }

  return jobs;
}

async function scrapeGupyRest(runId: string, companies: string[], queries: string[]): Promise<JobData[]> {
  const results: JobData[] = [];
  const API = 'https://employability-portal.gupy.io/api/v1/jobs';

  type SearchItem = { jobName?: string; careerPageName?: string };
  const searches: SearchItem[] = [];

  if (queries.length > 0) {
    for (const q of queries) {
      if (companies.length > 0) {
        for (const c of companies) {
          searches.push({ jobName: q, careerPageName: c });
        }
      } else {
        searches.push({ jobName: q });
      }
    }
  } else if (companies.length > 0) {
    for (const c of companies) {
      searches.push({ careerPageName: c });
    }
  } else {
    searches.push({});
  }

  for (let i = 0; i < searches.length; i++) {
    const s = searches[i];
    const MAX_PER_SEARCH = 500;
    const PAGE_SIZE = 100;
    let offset = 0;
    let pageResults: any[] = [];

    while (offset < MAX_PER_SEARCH) {
      const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
      if (s.jobName) params.set('jobName', s.jobName);
      if (s.careerPageName) params.set('careerPageName', s.careerPageName);

      const desc = s.jobName || s.careerPageName || 'todas';
      progressEmitter.emit(runId, {
        type: 'step_progress', step: 'Gupy',
        current: i + 1, total: searches.length,
        message: `Gupy REST (${i + 1}/${searches.length}): ${desc} (offset ${offset})`,
      });

      try {
        const url = `${API}?${params}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) break;
        const json = await res.json();
        const data = json.data || [];
        if (data.length === 0) break;
        pageResults.push(...data);
        offset += PAGE_SIZE;
      } catch {
        break;
      }
    }

    for (const j of pageResults) {
      results.push({
        empresa: j.careerPageName || j.companyName || '',
        plataforma: 'Gupy',
        na_lista: companies.some(c => c.toLowerCase() === (j.careerPageName || '').toLowerCase()) ? 'Sim' : 'Não',
        cargo_categoria: inferRole(j.name),
        titulo_vaga: j.name,
        tipo: j.workplaceType,
        local: [j.city, j.state, j.country].filter(Boolean).join(' / '),
        link: j.jobUrl || j.careerPageUrl || '',
        nome_na_plataforma: j.careerPageName,
        publicado: j.publishedDate || '',
        alerta: '',
      });
    }
  }

  const filtered = filterByCompany(results, companies);

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Gupy',
    message: `Gupy REST: ${filtered.length} vagas encontradas`,
  });

  return filtered;
}

function filterByCompany(jobs: JobData[], companies: string[]): JobData[] {
  if (companies.length === 0) return jobs;
  const normalized = companies.map(c => c.toLowerCase());
  return jobs.filter(j => normalized.includes(j.empresa.toLowerCase()));
}

function inferRole(title: string): string {
  const t = ' ' + title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
  const has = (re: RegExp) => re.test(t);
  if (has(/ revenue operations /) || has(/ revops /)) return 'Revenue Operations / RevOps';
  if (has(/ growth /)) return 'Growth Analyst / Analista de Growth';
  if (has(/ analista de insights /) || has(/ insights analyst /)) return 'Analista de Insights';
  if (has(/ inteligencia de mercado /) || has(/ market intelligence /)) return 'Analista de Inteligência de Mercado';
  if (has(/ analista de negocios /) || has(/ business analyst /)) return 'Business Analyst / Analista de Negócios';
  if (has(/ inteligencia de negocios /) || has(/ analista de bi /) || has(/ business intelligence /)) return 'BI / Business Intelligence';
  if (has(/ analista de dados /) || has(/ data analyst /)) return 'Analista de Dados / Data Analyst';
  return '';
}
