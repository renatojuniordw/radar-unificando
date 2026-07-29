import type { JobData, ProgressEvent } from '@/types';
import type { Result, TenantProbeResult } from './types';
import { RoleMatcher } from '../matching/role-matcher';
import { CompanyMatcher } from '../matching/company-matcher';
import { textUtils } from '../matching/text-utils';
import { config } from '@/config';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface InhireApiResponse {
  tenantName?: string;
  jobsPage?: Array<{
    jobId: string;
    displayName: string;
    workplaceType: string;
    location: string;
    status: string;
  }>;
}

export class InhireScraper {
  constructor(
    private readonly roleMatcher: RoleMatcher,
    private readonly companyMatcher: CompanyMatcher
  ) {}

  async fetchTenant(slug: string): Promise<InhireApiResponse | null> {
    try {
      const res = await fetch(config.inhire.apiUrl, {
        headers: {
          'X-Inhire-Client': 'web-inhire',
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Tenant': slug,
        },
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (Array.isArray(json)) return null;
      return json;
    } catch {
      return null;
    }
  }

  async validateTenants(
    slugs: string[],
    companies: string[],
    onProgress: (event: ProgressEvent) => void
  ): Promise<Result<TenantProbeResult[]>> {
    try {
      const tenants: TenantProbeResult[] = [];
      let done = 0;

      onProgress({ type: 'step_progress', step: 'Validar InHire', message: `Validando ${slugs.length} slugs...` });

      for (const slug of slugs) {
        let data: InhireApiResponse | null = null;
        for (let attempt = 0; attempt < config.inhire.retriesPerSlug; attempt++) {
          data = await this.fetchTenant(slug);
          if (data) break;
          await sleep(config.inhire.retryDelay);
        }

        if (data && data.tenantName !== undefined) {
          const jobs = Array.isArray(data.jobsPage) ? data.jobsPage : [];
          const hit = companies.find(c => this.companyMatcher.matches(c, data.tenantName || slug)) || null;
          tenants.push({
            slug,
            tenantName: data.tenantName || slug,
            jobsCount: jobs.length,
            jobs: jobs.map(j => ({
              jobId: j.jobId,
              displayName: j.displayName,
              workplaceType: j.workplaceType,
              location: j.location,
              status: j.status,
            })),
            listCompany: hit,
          });
        }

        done++;
        if (done % 50 === 0) {
          onProgress({
            type: 'step_progress',
            step: 'Validar InHire',
            message: `${done}/${slugs.length} validados, ${tenants.length} tenants reais`,
          });
        }
      }

      const bySlug = new Map<string, TenantProbeResult>();
      tenants.forEach(t => bySlug.set(t.slug, t));
      const unique = [...bySlug.values()];

      onProgress({
        type: 'step_complete',
        step: 'Validar InHire',
        message: `${unique.length} tenants confirmados`,
      });

      return { ok: true, value: unique };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }

  async scrapeAll(
    tenants: TenantProbeResult[],
    companies: string[],
    onProgress: (event: ProgressEvent) => void
  ): Promise<Result<{ jobs: JobData[]; newCompanies: Array<{ nome: string; total_vagas: number; url_carreiras: string }> }>> {
    try {
      const allJobs: JobData[] = [];
      let processed = 0;

      onProgress({ type: 'step_progress', step: 'Scrape InHire', message: `Buscando vagas em ${tenants.length} tenants...` });

      for (const tenant of tenants) {
        for (const j of tenant.jobs) {
          if (String(j.status || '').toLowerCase() !== 'published' && j.status) continue;
          const role = this.roleMatcher.match(j.displayName);
          const wp = String(j.workplaceType || '').toLowerCase();
          if (!role || !(wp.includes('remote') || wp.includes('remoto'))) continue;

          allJobs.push({
            empresa: tenant.listCompany || tenant.tenantName,
            plataforma: 'InHire',
            na_lista: tenant.listCompany ? 'Sim' : 'Não',
            cargo_categoria: role,
            titulo_vaga: j.displayName,
            tipo: j.workplaceType,
            local: j.location || '',
            link: `https://${tenant.slug}.inhire.app/vagas/${j.jobId}/${textUtils.slugify(j.displayName)}`,
            nome_na_plataforma: tenant.tenantName,
            publicado: '',
            alerta: this.companyMatcher.alerta(j.displayName, j.location || ''),
          });
        }

        processed++;
        if (processed % 100 === 0) {
          onProgress({
            type: 'step_progress',
            step: 'Scrape InHire',
            message: `${processed}/${tenants.length} processados, ${allJobs.length} vagas`,
          });
        }
      }

      const newCompanies = tenants
        .filter(t => !t.listCompany && t.jobsCount > 0)
        .map(t => ({
          nome: t.tenantName,
          total_vagas: t.jobsCount,
          url_carreiras: `https://${t.slug}.inhire.app/vagas`,
        }))
        .sort((a, b) => b.total_vagas - a.total_vagas);

      onProgress({
        type: 'step_complete',
        step: 'Scrape InHire',
        message: `${allJobs.length} vagas, ${newCompanies.length} novas empresas descobertas`,
      });

      return { ok: true, value: { jobs: allJobs, newCompanies } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }
}
