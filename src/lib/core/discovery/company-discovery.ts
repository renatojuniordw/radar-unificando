import { uniqueBy } from '@/lib/utils/array';
import { API_ENDPOINTS } from '@/lib/core/constants';

interface DiscoveredCompany {
  name: string;
  careersUrl: string;
  source: 'wayback' | 'urlscan' | 'commoncrawl';
}

export type { DiscoveredCompany };

export class CompanyDiscovery {
  async discover(knownCompanies: string[]): Promise<DiscoveredCompany[]> {
    const results: DiscoveredCompany[] = [];

    const [waybackResults, urlscanResults] = await Promise.allSettled([
      this.searchWayback(knownCompanies),
      this.searchUrlscan(knownCompanies),
    ]);

    if (waybackResults.status === 'fulfilled') {
      results.push(...waybackResults.value);
    }

    if (urlscanResults.status === 'fulfilled') {
      results.push(...urlscanResults.value);
    }

    return this.dedup(results);
  }

  private async searchWayback(knownCompanies: string[]): Promise<DiscoveredCompany[]> {
    try {
      const cdxUrl = API_ENDPOINTS.waybackCdx;
      const targets = this.generateTargetUrls(knownCompanies);

      const results: DiscoveredCompany[] = [];

      for (const { company, url } of targets.slice(0, 5)) {
        try {
          const res = await fetch(`${cdxUrl}&url=${encodeURIComponent(url)}*`, {
            signal: AbortSignal.timeout(5000),
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 1) {
              results.push({
                name: company,
                careersUrl: url,
                source: 'wayback',
              });
            }
          }
        } catch {
          continue;
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  private async searchUrlscan(knownCompanies: string[]): Promise<DiscoveredCompany[]> {
    try {
      const results: DiscoveredCompany[] = [];

      for (const company of knownCompanies.slice(0, 5)) {
        try {
          const searchUrl = `${API_ENDPOINTS.urlscanSearch}${encodeURIComponent(company + ' carreiras')}`;
          const res = await fetch(searchUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000),
          });

          if (res.ok) {
            const data = await res.json();
            const urls = data.results || [];
            for (const item of urls.slice(0, 3)) {
              const pageUrl = item.page?.url || '';
              if (pageUrl.toLowerCase().includes('carreira') || pageUrl.toLowerCase().includes('trabalhe')) {
                results.push({
                  name: company,
                  careersUrl: pageUrl,
                  source: 'urlscan',
                });
              }
            }
          }
        } catch {
          continue;
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  private generateTargetUrls(companies: string[]): Array<{ company: string; url: string }> {
    const targets: Array<{ company: string; url: string }> = [];

    for (const company of companies) {
      const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^(https?:\/\/)?(www\.)?/, '');

      variants(slug).forEach(url => {
        targets.push({ company, url });
      });
    }

    return targets;
  }

  private dedup(results: DiscoveredCompany[]): DiscoveredCompany[] {
    return uniqueBy(results, (r) => r.name.toLowerCase().trim());
  }
}

function variants(slug: string): string[] {
  const base = slug.length > 20 ? slug.slice(0, 20) : slug;
  return [
    `https://${base}.gupy.io`,
    `https://${base}.hire.tech`,
    `https://carreiras.${base}.com.br`,
    `https://trabalheconosco.${base}.com.br`,
    `https://jobs.${base}.com`,
  ];
}

export const companyDiscovery = new CompanyDiscovery();
