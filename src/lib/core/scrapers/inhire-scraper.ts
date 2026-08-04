import type { JobData } from '@/types';

interface ApiJob {
  careerPageId: string;
  careerPageIds: string[];
  displayName: string;
  jobId: string;
  status: string;
  workplaceType: string;
  location: string;
}

interface ApiResponse {
  tenantName: string;
  about?: string;
  logo?: string;
  bannerTitle?: string;
  background?: string[];
  jobsPage: ApiJob[];
}

export class InHireScraper {
  private baseUrl = 'https://api.inhire.app/job-posts/public/pages';
  private headers = {
    'X-Inhire-Client': 'web-inhire',
    'Content-Type': 'application/json',
  };

  async searchJobs(companies?: string[]): Promise<JobData[]> {
    if (!companies?.length) return [];

    const results: JobData[] = [];
    for (const company of companies) {
      const jobs = await this.searchCompany(company);
      results.push(...jobs);
    }
    return results;
  }

  async searchCompany(name: string): Promise<JobData[]> {
    const slugs = this.slugVariants(name);

    for (const slug of slugs) {
      try {
        const res = await fetch(this.baseUrl, {
          method: 'GET',
          headers: { ...this.headers, 'X-Tenant': slug },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;

        const data: ApiResponse = await res.json();
        if (Array.isArray(data) || !data.tenantName) continue;

        const jobs = Array.isArray(data.jobsPage) ? data.jobsPage : [];
        return jobs
          .filter(j => String(j.status || '').toLowerCase() === 'published')
          .map(j => this.normalize(j, data.tenantName, slug));
      } catch {
        continue;
      }
    }
    return [];
  }

  private slugVariants(name: string): string[] {
    const base = name.toLowerCase().trim();
    const compacted = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
    const tokens = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean);

    const variants = [compacted];
    if (tokens.length > 1) {
      variants.push(tokens.join('-'));
      variants.push(tokens[0]);
    }
    if (base.includes(' ') && base !== compacted) {
      variants.push(base.replace(/\s+/g, ''));
    }
    return [...new Set(variants.filter(Boolean))];
  }

  private normalize(j: ApiJob, tenantName: string, slug: string): JobData {
    return {
      empresa: tenantName || slug,
      plataforma: 'InHire',
      na_lista: 'Não',
      cargo_categoria: this.inferRole(j.displayName),
      titulo_vaga: j.displayName.trim(),
      tipo: j.workplaceType || '',
      local: j.location || '',
      link: `https://${slug}.inhire.app/vagas/${j.jobId}/${this.slugify(j.displayName)}`,
      nome_na_plataforma: tenantName || slug,
      publicado: '',
      alerta: '',
    };
  }

  private slugify(s: string): string {
    return String(s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'vaga';
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
