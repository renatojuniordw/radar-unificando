import type { JobData } from '@/types';

interface InHireJob {
  id: number;
  titulo: string;
  empresa: string;
  local: string;
  dataPublicacao: string;
  url: string;
  descricao: string;
}

export class InHireScraper {
  private baseUrl = 'https://api.inhire.com.br';

  async searchJobs(companies?: string[]): Promise<JobData[]> {
    const results: JobData[] = [];

    const endpoints = companies?.length
      ? companies.map(c => `/vagas?empresa=${encodeURIComponent(c)}&limit=50`)
      : ['/vagas?limit=100'];

    for (const endpoint of endpoints) {
      try {
        const jobs = await this.fetchJobs(endpoint);
        results.push(...jobs.map(j => this.normalize(j)));
      } catch {
        continue;
      }
    }

    return results;
  }

  async searchCompany(name: string): Promise<JobData[]> {
    try {
      const jobs = await this.fetchJobs(`/vagas?empresa=${encodeURIComponent(name)}&limit=50`);
      return jobs.map(j => this.normalize(j));
    } catch {
      return [];
    }
  }

  private async fetchJobs(endpoint: string): Promise<InHireJob[]> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.vagas || data.data || [];
  }

  private normalize(j: InHireJob): JobData {
    const isRemote = j.local?.toLowerCase().includes('remoto') || j.local?.toLowerCase().includes('remote');

    return {
      empresa: j.empresa || '',
      plataforma: 'InHire',
      na_lista: 'Não',
      cargo_categoria: this.inferRole(j.titulo),
      titulo_vaga: j.titulo,
      tipo: isRemote ? 'Remoto' : j.local || '',
      local: j.local || '',
      link: j.url || '',
      nome_na_plataforma: j.empresa || '',
      publicado: j.dataPublicacao || '',
      alerta: '',
    };
  }

  private inferRole(title: string): string {
    const t = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (t.includes('revenue') || t.includes('revops')) return 'Revenue Operations / RevOps';
    if (t.includes('growth')) return 'Growth Analyst / Analista de Growth';
    if (t.includes('insights')) return 'Analista de Insights';
    if (t.includes('inteligencia') || t.includes('market intelligence')) return 'Analista de Inteligência de Mercado';
    if (t.includes('business analyst') || t.includes('analista de negocios')) return 'Business Analyst / Analista de Negocios';
    if (t.includes('business intelligence') || t.includes('bi ') || t.includes('analista de bi')) return 'BI / Business Intelligence';
    if (t.includes('data analyst') || t.includes('analista de dados')) return 'Analista de Dados / Data Analyst';
    if (t.includes('dados')) return 'Analista de Dados / Data Analyst';
    return '';
  }
}

export const inhireScraper = new InHireScraper();
