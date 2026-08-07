import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  JobLinkFilter,
  CachedLinkChecker,
  type LinkChecker,
} from '@/lib/core/pipeline/job-link-filter';

// Fake da interface LinkChecker (LSP: qualquer implementação funciona no filtro)
class FakeChecker implements LinkChecker {
  constructor(private readonly deadUrls: Set<string>) {}
  isDead = vi.fn(async (url: string) => this.deadUrls.has(url));
}

const jobs = [
  { link: 'https://gupy.io/vaga-1', title: 'Dev 1' },
  { link: 'https://gupy.io/vaga-2', title: 'Dev 2' },
  { link: 'https://gupy.io/vaga-3', title: 'Dev 3' },
  { link: 'https://gupy.io/vaga-4', title: 'Dev 4' },
];

describe('JobLinkFilter', () => {
  it('should_keep_only_alive_jobs', async () => {
    const checker = new FakeChecker(new Set(['https://gupy.io/vaga-2', 'https://gupy.io/vaga-4']));
    const filter = new JobLinkFilter(checker);
    const alive = await filter.filterAlive(jobs);
    expect(alive.map((j) => j.link)).toEqual(['https://gupy.io/vaga-1', 'https://gupy.io/vaga-3']);
  });

  it('should_return_empty_array_for_empty_input', async () => {
    const filter = new JobLinkFilter(new FakeChecker(new Set()));
    expect(await filter.filterAlive([])).toEqual([]);
  });

  it('should_respect_concurrency_option', async () => {
    const checker = new FakeChecker(new Set());
    const filter = new JobLinkFilter(checker);
    await filter.filterAlive(jobs, { concurrency: 2 });
    expect(checker.isDead).toHaveBeenCalledTimes(4);
  });
});

describe('CachedLinkChecker', () => {
  it('should_call_inner_only_once_per_url_within_ttl', async () => {
    const inner = new FakeChecker(new Set(['https://gupy.io/dead']));
    const cached = new CachedLinkChecker(inner);
    await cached.isDead('https://gupy.io/dead');
    await cached.isDead('https://gupy.io/dead');
    await cached.isDead('https://gupy.io/alive');
    await cached.isDead('https://gupy.io/alive');
    expect(inner.isDead).toHaveBeenCalledTimes(2); // 1 por URL
  });

  it('should_expire_after_ttl', async () => {
    const inner = new FakeChecker(new Set());
    const cached = new CachedLinkChecker(inner, 10); // TTL 10ms
    await cached.isDead('https://gupy.io/x');
    await new Promise((r) => setTimeout(r, 20));
    await cached.isDead('https://gupy.io/x');
    expect(inner.isDead).toHaveBeenCalledTimes(2);
  });
});
