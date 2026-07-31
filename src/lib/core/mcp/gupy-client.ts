import type { JobData } from '@/types';

interface McpResponse {
  jsonrpc: string;
  id: string;
  result?: {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

export class GupyMcpClient {
  private url = 'https://candidates.mcp.api.gupy.io/mcp';

  async searchJobs(query: string, limit = 50): Promise<JobData[]> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_jobs',
          arguments: { term: query, limit },
        },
        id: crypto.randomUUID(),
      }),
    });

    if (!res.ok) {
      throw new Error(`MCP HTTP ${res.status}`);
    }

    const data = await this.parseResponse(res);

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    if (!data.result?.content) {
      console.warn('[gupy-client] resposta sem content:', JSON.stringify(data).slice(0, 500));
      return [];
    }

    const textContent = data.result.content.find(c => c.type === 'text');
    if (!textContent) return [];

    if (data.result.isError) {
      throw new Error(`MCP tool error: ${textContent.text}`);
    }

    try {
      const parsed = JSON.parse(textContent.text);
      const rawJobs = parsed.data?.data || parsed.jobs || parsed;
      const jobs = this.normalizeJobs(rawJobs);
      console.log(`[gupy-client] query="${query}" -> ${jobs.length} vagas`);
      return jobs;
    } catch (err) {
      console.warn(`[gupy-client] falha ao parsear content para query="${query}":`, textContent.text.slice(0, 500), err);
      return [];
    }
  }

  private async parseResponse(res: Response): Promise<McpResponse> {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const raw = await res.text();
      const dataLine = raw
        .split('\n')
        .find(line => line.startsWith('data:'));
      if (!dataLine) throw new Error('MCP: resposta SSE sem dados');
      return JSON.parse(dataLine.slice(5).trim());
    }
    return res.json();
  }

  private normalizeJobs(raw: any[]): JobData[] {
    return (raw || []).map((j: any) => ({
      empresa: j.careerPageName || j.company || j.empresa || '',
      plataforma: 'Gupy' as const,
      na_lista: 'Não' as const,
      cargo_categoria: this.inferRole(j.title || j.name || ''),
      titulo_vaga: j.title || j.name || '',
      tipo: j.workplaceType || j.work_type || '',
      local: [j.city, j.state, j.country].filter(Boolean).join(' / ') || j.location || '',
      link: j.jobUrl || j.url || j.link || '',
      nome_na_plataforma: j.careerPageName || j.company || '',
      publicado: j.publishedDate || j.created_at || '',
      alerta: '',
    }));
  }

  private inferRole(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('revenue') || t.includes('revops')) return 'Revenue Operations / RevOps';
    if (t.includes('growth')) return 'Growth Analyst / Analista de Growth';
    if (t.includes('insights')) return 'Analista de Insights';
    if (t.includes('inteligência') || t.includes('market intelligence')) return 'Analista de Inteligência de Mercado';
    if (t.includes('business analyst') || t.includes('analista de negócios')) return 'Business Analyst / Analista de Negócios';
    if (t.includes('business intelligence') || t.includes('bi ') || t.includes('analista de bi')) return 'BI / Business Intelligence';
    if (t.includes('data analyst') || t.includes('analista de dados')) return 'Analista de Dados / Data Analyst';
    return '';
  }
}

export const gupyMcpClient = new GupyMcpClient();
