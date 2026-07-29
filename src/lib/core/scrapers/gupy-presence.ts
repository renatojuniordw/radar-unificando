import type { ProgressEvent } from '@/types';
import type { Result } from './types';
import { textUtils } from '../matching/text-utils';
import { CompanyMatcher } from '../matching/company-matcher';
import { config } from '@/config';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface PresenceEntry {
  empresa: string;
  url: string;
}

export class GupyPresenceScraper {
  constructor(private readonly companyMatcher: CompanyMatcher) {}

  slugVariants(name: string): string[] {
    const allToks = textUtils.tokens(name);
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

  async probe(slug: string): Promise<string | null> {
    try {
      const res = await fetch(`https://${slug}.gupy.io/`, { redirect: 'follow' });
      if (res.status !== 200) return null;
      const html = await res.text();
      const m = html.match(/<title>([^<]*)<\/title>/i);
      const title = m ? m[1].trim() : '';
      if (!title || /^404$/.test(title)) return null;
      return title;
    } catch {
      return null;
    }
  }

  titleMatches(company: string, title: string): boolean {
    return this.companyMatcher.matches(company, title);
  }

  async checkPresence(
    companies: string[],
    onProgress: (event: ProgressEvent) => void
  ): Promise<Result<PresenceEntry[]>> {
    try {
      const found: PresenceEntry[] = [];
      let checked = 0;

      for (const company of companies) {
        for (const slug of this.slugVariants(company)) {
          const title = await this.probe(slug);
          if (title && this.titleMatches(company, title)) {
            found.push({ empresa: company, url: `https://${slug}.gupy.io/` });
            break;
          }
        }
        checked++;
        if (checked % 50 === 0) {
          onProgress({
            type: 'step_progress',
            step: 'Presença Gupy',
            message: `${checked}/${companies.length} verificadas, ${found.length} encontradas`,
          });
        }
        await sleep(50);
      }

      onProgress({
        type: 'step_complete',
        step: 'Presença Gupy',
        message: `${found.length}/${companies.length} empresas com página Gupy`,
      });

      return { ok: true, value: found };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }
}
