import { describe, it, expect } from 'vitest';

describe('Robots', () => {
  it('should_return_rules_and_sitemap', async () => {
    const robots = (await import('@/app/robots')).default;
    const result = robots();
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].allow).toBe('/');
    expect(result.sitemap).toContain('sitemap.xml');
  });
});

describe('Sitemap', () => {
  it('should_return_pages', async () => {
    const sitemap = (await import('@/app/sitemap')).default;
    const result = sitemap();
    expect(result).toHaveLength(3);
    expect(result[0].url).toContain('radarunificando.com.br');
    expect(result[0].changeFrequency).toBe('daily');
  });
});
