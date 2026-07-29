import type { JobData, ProgressEvent } from '@/types';
import type { IScraper, Result, ScrapeParams, ScrapeResult, TenantProbeResult } from './types';
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

export class InhireGuessScraper implements IScraper {
  readonly platform = 'InHire' as const;

  constructor(
    private readonly roleMatcher: RoleMatcher,
    private readonly companyMatcher: CompanyMatcher
  ) {}

  slugVariants(name: string): string[] {
    const allToks = textUtils.normalize(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const toks = this.companyMatcher.meaningfulTokens(name);
    const set = new Set<string>();
    const add = (v: string) => { if (v && v.length >= 2 && v.length <= 40) set.add(v); };

    add(textUtils.compact(name));
    add(allToks.join(''));
    add(toks.join(''));
    add(allToks.join('-'));
    add(toks.join('-'));
    if (toks[0]) add(toks[0]);
    if (allToks[0]) add(allToks[0]);

    return [...set];
  }

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

  async scrape(params: ScrapeParams): Promise<Result<ScrapeResult>> {
    try {
      const { companies, onProgress } = params;
      const allJobs: JobData[] = [];
      const foundTenants: TenantProbeResult[] = [];

      onProgress({ type: 'step_progress', step: 'InHire (lista)', message: `Verificando ${companies.length} empresas...` });

      for (let idx = 0; idx < companies.length; idx++) {
        const company = companies[idx];
        const variants = this.slugVariants(company);

        for (const slug of variants) {
          let data: InhireApiResponse | null = null;
          for (let attempt = 0; attempt < config.inhire.retriesPerSlug; attempt++) {
            data = await this.fetchTenant(slug);
            if (data) break;
            await sleep(config.inhire.retryDelay);
          }
          if (!data) continue;

          const tenantName = data.tenantName || slug;
          if (!this.companyMatcher.matches(company, tenantName)) continue;

          const jobs = Array.isArray(data.jobsPage) ? data.jobsPage : [];
          foundTenants.push({
            slug,
            tenantName,
            jobsCount: jobs.length,
            jobs: jobs.map(j => ({
              jobId: j.jobId,
              displayName: j.displayName,
              workplaceType: j.workplaceType,
              location: j.location,
              status: j.status,
            })),
            listCompany: company,
          });

          for (const j of jobs) {
            if (String(j.status || '').toLowerCase() !== 'published' && j.status) continue;
            const role = this.roleMatcher.match(j.displayName);
            const wp = String(j.workplaceType || '').toLowerCase();
            if (!role || !(wp.includes('remote') || wp.includes('remoto'))) continue;

            allJobs.push({
              empresa: company,
              plataforma: 'InHire',
              na_lista: 'Sim',
              cargo_categoria: role,
              titulo_vaga: j.displayName,
              tipo: j.workplaceType,
              local: j.location || '',
              link: `https://${slug}.inhire.app/vagas/${j.jobId}/${textUtils.slugify(j.displayName)}`,
              nome_na_plataforma: tenantName,
              publicado: '',
              alerta: this.companyMatcher.alerta(j.displayName, j.location || ''),
            });
          }
          break;
        }

        if ((idx + 1) % 50 === 0) {
          onProgress({
            type: 'step_progress',
            step: 'InHire (lista)',
            message: `${idx + 1}/${companies.length} verificadas, ${foundTenants.length} tenants encontrados`,
          });
        }
      }

      onProgress({
        type: 'step_complete',
        step: 'InHire (lista)',
        message: `${foundTenants.length} tenants, ${allJobs.length} vagas`,
      });

      return {
        ok: true,
        value: {
          platform: 'InHire',
          jobs: allJobs,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }
}
