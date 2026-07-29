import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { JobData } from '@/types';

const GUPY_QUERIES = [
  'Analista de Dados', 'Data Analyst', 'Analista de BI', 'Business Intelligence',
  'Business Analyst', 'Analista de Negócios', 'Inteligência de Negócios',
  'Growth', 'Revenue Operations', 'RevOps', 'Analista de Insights',
  'Inteligência de Mercado', 'Market Intelligence',
];

export interface GupyStepOptions {
  companies: string[];
  isLoggedIn: boolean;
}

export async function runGupyStep(runId: string, options: GupyStepOptions): Promise<JobData[]> {
  const { companies, isLoggedIn } = options;
  const jobs: JobData[] = [];

  progressEmitter.emit(runId, {
    type: 'step_start', step: 'Gupy',
    message: `Buscando vagas na Gupy (${isLoggedIn ? 'MCP' : 'REST'})...`,
  });

  if (isLoggedIn) {
    try {
      for (let i = 0; i < GUPY_QUERIES.length; i++) {
        progressEmitter.emit(runId, {
          type: 'step_progress', step: 'Gupy',
          current: i + 1, total: GUPY_QUERIES.length,
          message: `Gupy MCP (${i + 1}/${GUPY_QUERIES.length}): ${GUPY_QUERIES[i]}`,
        });
        const result = await gupyMcpClient.searchJobs(GUPY_QUERIES[i], 100);
        jobs.push(...result);
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
      const restJobs = await scrapeGupyRest(runId, companies);
      jobs.push(...restJobs);
    }
  } else {
    const restJobs = await scrapeGupyRest(runId, companies);
    jobs.push(...restJobs);
  }

  return jobs;
}

async function scrapeGupyRest(runId: string, companies: string[]): Promise<JobData[]> {
  const results: JobData[] = [];
  const API = 'https://employability-portal.gupy.io/api/v1/jobs';

  for (let i = 0; i < GUPY_QUERIES.length; i++) {
    progressEmitter.emit(runId, {
      type: 'step_progress', step: 'Gupy',
      current: i + 1, total: GUPY_QUERIES.length,
      message: `Gupy REST (${i + 1}/${GUPY_QUERIES.length}): ${GUPY_QUERIES[i]}`,
    });

    try {
      const url = `${API}?jobName=${encodeURIComponent(GUPY_QUERIES[i])}&offset=0&limit=100`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      const data = json.data || [];

      for (const j of data) {
        const wp = String(j.workplaceType || '').toLowerCase();
        const isRemote = j.isRemoteWork === true || wp.includes('remote') || wp.includes('remoto');
        if (!isRemote) continue;

        results.push({
          empresa: j.careerPageName || j.companyName || '',
          plataforma: 'Gupy',
          na_lista: companies.includes(j.careerPageName) ? 'Sim' : 'Não',
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
    } catch {
      continue;
    }
  }

  progressEmitter.emit(runId, {
    type: 'step_complete', step: 'Gupy',
    message: `Gupy REST: ${results.length} vagas encontradas`,
  });

  return results;
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
