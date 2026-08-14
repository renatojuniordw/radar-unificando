import { gupyMcpClient, type GupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { inferRole } from '@/lib/core/matching/infer-role';
import { filterIrrelevantDesignJobs } from '@/lib/core/pipeline/relevance-filter';
import { filterFreshJobs } from '@/lib/core/pipeline/freshness';
import { API_ENDPOINTS } from '@/lib/core/constants';
import type { Job } from '@/types';

interface GupyRestJob {
  careerPageName?: string;
  companyName?: string;
  name?: string;
  workplaceType?: string;
  city?: string;
  state?: string;
  country?: string;
  jobUrl?: string;
  careerPageUrl?: string;
  publishedDate?: string;
  description?: string;
}

const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'",
};

/** Remove tags HTML e decodifica entidades comuns da descrição da vaga (vem como HTML da API da Gupy). */
function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#?\w+);/g, (m, code) => HTML_ENTITIES[code.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

export interface GupyStepOptions {
  companies: string[];
  isLoggedIn: boolean;
  queries?: string[];
  /** Queries usadas no filtro de relevância (originais, sem expansão). */
  relevanceQueries?: string[];
}

export interface GupyStepDeps {
  mcpClient?: Pick<GupyMcpClient, 'searchJobs'>;
}

/** Limite máximo aceito pelo MCP da Gupy (acima disso a chamada falha na validação). */
const MCP_MAX_LIMIT = 100;
/** Máximo de vagas buscadas por query (MCP e REST). */
const MAX_PER_SEARCH = 500;
/** Tamanho de página da API REST da Gupy. */
const PAGE_SIZE = 100;

export function shouldUseGupyMCP(isLoggedIn: boolean, queries: string[]): boolean {
  return isLoggedIn && queries.length > 0;
}

export async function runGupyStep(runId: string, options: GupyStepOptions, deps: GupyStepDeps = {}): Promise<Job[]> {
  const { companies, isLoggedIn, queries = [], relevanceQueries = queries } = options;
  const { mcpClient = gupyMcpClient } = deps;
  const jobs: Job[] = [];

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Gupy',
    message: `Buscando vagas na Gupy...`,
  });

  if (shouldUseGupyMCP(isLoggedIn, queries)) {
    try {
      for (let i = 0; i < queries.length; i++) {
        progressEmitter.emit(runId, {
          type: 'step_progress', step: 'Gupy',
          current: i + 1, total: queries.length,
          message: `Gupy MCP (${i + 1}/${queries.length}): ${queries[i]}`,
        });
        // Pagina até MAX_PER_SEARCH, igual ao caminho REST — o MCP aceita offset.
        for (let offset = 0; offset < MAX_PER_SEARCH; offset += MCP_MAX_LIMIT) {
          const result = await mcpClient.searchJobs(queries[i], MCP_MAX_LIMIT, offset);
          jobs.push(...filterByCompany(result, companies));
          if (result.length < MCP_MAX_LIMIT) break;
        }
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

  return filterFreshJobs(filterIrrelevantDesignJobs(jobs, relevanceQueries));
}

async function scrapeGupyRest(runId: string, companies: string[], queries: string[]): Promise<Job[]> {
  const results: Job[] = [];
  const API = API_ENDPOINTS.gupyJobs;

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
    let offset = 0;
    const pageResults: GupyRestJob[] = [];

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
        const data: GupyRestJob[] = json.data || [];
        if (data.length === 0) break;
        pageResults.push(...data);
        offset += PAGE_SIZE;
      } catch {
        break;
      }
    }

    for (const j of pageResults) {
      results.push({
        company: j.careerPageName || j.companyName || '',
        platform: 'Gupy',
        onList: companies.some(c => c.toLowerCase() === (j.careerPageName || '').toLowerCase()) ? 'Sim' : 'Não',
        roleCategory: inferRole(j.name || ''),
        title: j.name || '',
        type: j.workplaceType || '',
        location: [j.city, j.state, j.country].filter(Boolean).join(' / '),
        link: j.jobUrl || j.careerPageUrl || '',
        companyNameOnPlatform: j.careerPageName || '',
        postedAt: j.publishedDate || '',
        alert: '',
        description: j.description ? stripHtml(j.description).slice(0, 3000) : undefined,
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

function filterByCompany(jobs: Job[], companies: string[]): Job[] {
  if (companies.length === 0) return jobs;
  const normalized = companies.map(c => c.toLowerCase());
  return jobs.filter(j => normalized.includes(j.company.toLowerCase()));
}

