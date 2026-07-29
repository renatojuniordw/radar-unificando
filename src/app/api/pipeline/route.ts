import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { pipelineLimiter } from '@/lib/infrastructure/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    const { allowed, remaining } = pipelineLimiter.check(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde 5 minutos entre execuções.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    const { companies, discoveryEnabled } = await req.json();

    const runId = crypto.randomUUID();

    await prisma.pipelineRun.create({
      data: {
        id: runId,
        userId,
        status: 'running',
        discoveryEnabled: discoveryEnabled !== false,
      },
    });

    progressEmitter.emit(runId, { type: 'step_start', message: 'Iniciando pipeline...' });

    runPipeline(runId, userId, companies || [], discoveryEnabled !== false);

    return NextResponse.json({ runId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar pipeline' },
      { status: 500 }
    );
  }
}

async function runPipeline(runId: string, userId: string, companies: string[], discoveryEnabled: boolean) {
  try {
    progressEmitter.emit(runId, { type: 'step_start', step: 'Gupy', message: 'Buscando vagas na Gupy...' });

    const gupyJobs: any[] = [];
    if (userId !== 'anonymous') {
      try {
        for (let i = 0; i < gupyQueries.length; i++) {
          progressEmitter.emit(runId, { type: 'step_progress', step: 'Gupy', current: i + 1, total: gupyQueries.length, message: `Gupy MCP (${i + 1}/${gupyQueries.length}): ${gupyQueries[i]}` });
          const result = await gupyMcpClient.searchJobs(gupyQueries[i], 100);
          gupyJobs.push(...result);
        }
        progressEmitter.emit(runId, { type: 'step_complete', step: 'Gupy', message: `Gupy MCP: ${gupyJobs.length} vagas encontradas` });
      } catch {
        progressEmitter.emit(runId, { type: 'step_warn', step: 'Gupy', message: 'MCP falhou, usando fallback REST...' });
        const restJobs = await scrapeGupyRest(companies);
        gupyJobs.push(...restJobs);
        progressEmitter.emit(runId, { type: 'step_complete', step: 'Gupy', message: `Gupy REST: ${restJobs.length} vagas encontradas` });
      }
    } else {
      const restJobs = await scrapeGupyRest(companies);
      gupyJobs.push(...restJobs);
      progressEmitter.emit(runId, { type: 'step_complete', step: 'Gupy', message: `Gupy REST: ${restJobs.length} vagas encontradas` });
    }

    progressEmitter.emit(runId, { type: 'step_start', step: 'Merge', message: `Salvando ${gupyJobs.length} vagas...` });
    let inserted = 0;
    for (const job of gupyJobs.slice(0, 200)) {
      try {
        await prisma.job.create({
          data: {
            userId,
            source: userId !== 'anonymous' ? 'gupy_mcp' : 'gupy_api',
            empresa: job.empresa || 'Desconhecida',
            plataforma: 'Gupy',
            naLista: companies.includes(job.empresa) ? 'Sim' : 'Não',
            cargoCategoria: job.cargo_categoria,
            tituloVaga: job.titulo_vaga,
            tipo: job.tipo,
            local: job.local,
            link: job.link,
            nomeNaPlataforma: job.nome_na_plataforma,
            publicado: job.publicado,
            alerta: job.alerta,
          },
        });
        inserted++;
      } catch {
        // Duplicate, skip
      }
    }
    progressEmitter.emit(runId, { type: 'step_complete', step: 'Merge', message: `${inserted} vagas salvas no banco` });

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'completed', totalJobs: gupyJobs.length, gupyJobs: gupyJobs.length, finishedAt: new Date() },
    });

    progressEmitter.emit(runId, { type: 'pipeline_complete', message: `Pipeline concluído! ${gupyJobs.length} vagas encontradas.` });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    progressEmitter.emit(runId, { type: 'step_error', step: 'Pipeline', error: message, message: `Falha: ${message}` });
    progressEmitter.emit(runId, { type: 'pipeline_error', message: 'Pipeline falhou' });

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'failed', finishedAt: new Date() },
    });
  }
}

const gupyQueries = [
  'Analista de Dados', 'Data Analyst', 'Analista de BI', 'Business Intelligence',
  'Business Analyst', 'Analista de Negócios', 'Inteligência de Negócios',
  'Growth', 'Revenue Operations', 'RevOps', 'Analista de Insights',
  'Inteligência de Mercado', 'Market Intelligence',
];

async function scrapeGupyRest(companies: string[]): Promise<any[]> {
  const results: any[] = [];
  const API = 'https://employability-portal.gupy.io/api/v1/jobs';

  for (const query of gupyQueries) {
    try {
      const url = `${API}?jobName=${encodeURIComponent(query)}&offset=0&limit=100`;
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
