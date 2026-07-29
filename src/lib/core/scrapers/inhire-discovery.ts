import type { ProgressEvent } from '@/types';
import type { Result } from './types';
import { config } from '@/config';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const INFRA = new Set([
  'www', 'api', 'auth', 'app', 'status', 'mcp', 'mcp-dev', 'inhub', 'login',
  'admin', 'inhire-admin', 'saml-setup', 'sso-setup', 'preview', 'senior',
  'files', 'portal', 'board', 'people', 'new', 'novo', 'conteudo', 'docs',
  'email', 'lp', 'hub', 'webinar', 'analytics', 'analytics-ss',
]);

export class InhireDiscovery {
  async discover(onProgress: (event: ProgressEvent) => void): Promise<Result<string[]>> {
    try {
      const allSlugs = new Set<string>();
      const addHost = (h: string) => {
        const m = String(h || '').toLowerCase().match(/^([a-z0-9-]+)\.inhire\.app$/);
        if (m) allSlugs.add(m[1]);
      };
      const addUrl = (u: string) => {
        const m = String(u || '').match(/https?:\/\/([a-z0-9-]+)\.inhire\.app/i);
        if (m) allSlugs.add(m[1].toLowerCase());
      };

      onProgress({ type: 'step_progress', step: 'Discovery InHire', message: 'Buscando no Wayback Machine...' });
      try {
        const url = `${config.discovery.wayback.url}?url=*.inhire.app&output=text&fl=original&collapse=urlkey&limit=${config.discovery.wayback.limit}`;
        const res = await fetch(url);
        const text = await res.text();
        const matches = text.match(/https?:\/\/[a-z0-9-]+\.inhire\.app/gi) || [];
        matches.forEach(u => addUrl(u));
        onProgress({ type: 'step_progress', step: 'Discovery InHire', message: `Wayback: ${allSlugs.size} hosts únicos` });
      } catch (e) {
        onProgress({ type: 'step_warn', step: 'Discovery InHire', message: `Wayback falhou: ${e instanceof Error ? e.message : 'erro'}` });
      }

      await sleep(500);

      onProgress({ type: 'step_progress', step: 'Discovery InHire', message: 'Buscando no urlscan.io...' });
      try {
        const base = `${config.discovery.urlscan.url}?q=domain:inhire.app&size=100`;
        let after = '';
        for (let i = 0; i < config.discovery.urlscan.pages; i++) {
          const url = base + (after ? '&search_after=' + after : '');
          const r = await fetch(url);
          const j = await r.json();
          const results = j.results || [];
          for (const res of results) {
            if (res.page?.domain) addHost(res.page.domain);
            if (res.page?.url) addUrl(res.page.url);
            if (res.task?.url) addUrl(res.task.url);
          }
          if (results.length < 100) break;
          after = (results[results.length - 1].sort || []).join(',');
          await sleep(config.discovery.urlscan.delay);
        }
        onProgress({ type: 'step_progress', step: 'Discovery InHire', message: `urlscan: ${allSlugs.size} hosts` });
      } catch (e) {
        onProgress({ type: 'step_warn', step: 'Discovery InHire', message: `urlscan falhou: ${e instanceof Error ? e.message : 'erro'}` });
      }

      await sleep(500);

      onProgress({ type: 'step_progress', step: 'Discovery InHire', message: 'Buscando no Common Crawl...' });
      try {
        const info = await (await fetch('https://index.commoncrawl.org/collinfo.json')).json();
        const indexes = info.slice(0, config.discovery.commonCrawl.indexesMax).map((x: { id: string }) => x.id);

        for (const idx of indexes) {
          try {
            const t = await (await fetch(`https://index.commoncrawl.org/${idx}-index?url=*.inhire.app&output=json&fl=url`)).text();
            t.split('\n').filter(Boolean).forEach(line => {
              try { addUrl(JSON.parse(line).url); } catch { }
            });
          } catch { }
          await sleep(config.discovery.commonCrawl.delay);
        }
        onProgress({ type: 'step_progress', step: 'Discovery InHire', message: `Common Crawl: ${allSlugs.size} hosts` });
      } catch (e) {
        onProgress({ type: 'step_warn', step: 'Discovery InHire', message: `Common Crawl falhou: ${e instanceof Error ? e.message : 'erro'}` });
      }

      const filtered = [...allSlugs].filter(s => s && !INFRA.has(s) && s.length >= 2);

      onProgress({
        type: 'step_complete',
        step: 'Discovery InHire',
        message: `${filtered.length} slugs candidatos (${allSlugs.size} brutos)`,
      });

      return { ok: true, value: filtered };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: true,
      };
    }
  }
}
