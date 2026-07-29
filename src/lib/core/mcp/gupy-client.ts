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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_jobs',
          arguments: { query, limit },
        },
        id: crypto.randomUUID(),
      }),
    });

    if (!res.ok) {
      throw new Error(`MCP HTTP ${res.status}`);
    }

    const data: McpResponse = await res.json();

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    if (!data.result?.content) return [];

    const textContent = data.result.content.find(c => c.type === 'text');
    if (!textContent) return [];

    try {
      const parsed = JSON.parse(textContent.text);
      return this.normalizeJobs(parsed.jobs || parsed);
    } catch {
      return [];
    }
  }

  private normalizeJobs(raw: any[]): JobData[] {
    return (raw || []).map((j: any) => ({
      empresa: j.company || j.empresa || '',
      plataforma: 'Gupy' as const,
      na_lista: 'Não' as const,
      cargo_categoria: this.inferRole(j.title || j.name || ''),
      titulo_vaga: j.title || j.name || '',
      tipo: j.workplaceType || j.work_type || '',
      local: j.location || j.city || '',
      link: j.jobUrl || j.url || j.link || '',
      nome_na_plataforma: j.company || '',
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
