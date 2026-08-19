import type { Job } from '@/types';
import { inferRole } from '@/lib/core/matching/infer-role';
import { debugLog } from '@/lib/utils/debug';
import { API_ENDPOINTS } from '@/lib/core/constants';

interface RawGupyJob {
  careerPageName?: string;
  company?: string;
  empresa?: string;
  title?: string;
  name?: string;
  workplaceType?: string;
  work_type?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  jobUrl?: string;
  url?: string;
  link?: string;
  publishedDate?: string;
  created_at?: string;
  description?: string;
}

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
  private url = API_ENDPOINTS.gupyMcp;

  async searchJobs(query: string, limit = 50, offset = 0): Promise<Job[]> {
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
          arguments: { term: query, limit, offset },
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
      console.warn('[gupy-client] resposta sem content (MCP retornou struct inesperada)');
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
      debugLog(`[gupy-client] query="${query}" -> ${jobs.length} vagas`);
      return jobs;
    } catch (err) {
      console.warn(`[gupy-client] falha ao parsear content para query="${query}": ${err instanceof Error ? err.message : String(err)}`);
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

  private normalizeJobs(raw: RawGupyJob[]): Job[] {
    return (raw || []).map((j) => ({
      company: j.careerPageName || j.company || j.empresa || '',
      platform: 'Gupy' as const,
      onList: 'Não' as const,
      roleCategory: inferRole(j.title || j.name || ''),
      title: j.title || j.name || '',
      type: j.workplaceType || j.work_type || '',
      location: [j.city, j.state, j.country].filter(Boolean).join(' / ') || j.location || '',
      link: j.jobUrl || j.url || j.link || '',
      companyNameOnPlatform: j.careerPageName || j.company || '',
      postedAt: j.publishedDate || j.created_at || '',
      alert: '',
      description: j.description ? String(j.description).slice(0, 3000) : undefined,
    }));
  }
}

export const gupyMcpClient = new GupyMcpClient();
