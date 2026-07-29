import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/infrastructure/db/client';
import { pipelineRuns } from '@/lib/infrastructure/db/schema';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { companies, discoveryEnabled } = await req.json();

    const db = getDb();
    const runId = crypto.randomUUID();
    const userId = session?.user?.id || 'anonymous';

    await db.insert(pipelineRuns).values({
      id: runId,
      userId,
      status: 'running',
      discoveryEnabled: discoveryEnabled !== false,
    });

    // Fire and forget
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
  const db = getDb();
  const { jobs } = await import('@/lib/infrastructure/db/schema');
  const { eq } = await import('drizzle-orm');

  try {
    // Step 1: Gupy MCP search (for logged-in users) + REST fallback
    const gupyJobs: any[] = [];
    if (userId !== 'anonymous') {
      try {
        for (const query of gupyQueries) {
          const result = await gupyMcpClient.searchJobs(query, 100);
          gupyJobs.push(...result);
        }
      } catch {
        // Fallback: use REST API
        const restJobs = await scrapeGupyRest(companies);
        gupyJobs.push(...restJobs);
      }
    } else {
      const restJobs = await scrapeGupyRest(companies);
      gupyJobs.push(...restJobs);
    }

    // Insert jobs
    for (const job of gupyJobs.slice(0, 200)) {
      try {
        await db.insert(jobs).values({
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
        });
      } catch {
        // Duplicate, skip
      }
    }

    // Update run status
    await db.update(pipelineRuns)
      .set({ status: 'completed', totalJobs: gupyJobs.length, gupyJobs: gupyJobs.length, finishedAt: new Date() })
      .where(eq(pipelineRuns.id, runId));

  } catch (error) {
    await db.update(pipelineRuns)
      .set({ status: 'failed', finishedAt: new Date() })
      .where(eq(pipelineRuns.id, runId));
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
