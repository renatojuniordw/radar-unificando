import { describe, it, expect } from 'vitest';
import { SITE } from '@/lib/core/constants';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('should_return_static_routes_with_base_url', async () => {
    const routes = await sitemap();
    expect(routes[0].url).toBe(SITE.url);
    expect(routes[0].priority).toBe(1.0);
    const urls = routes.map((r) => r.url);
    expect(urls).toContain(`${SITE.url}/busca`);
    expect(urls).toContain(`${SITE.url}/cursos`);
    expect(urls).toContain(`${SITE.url}/guia-ats`);
    expect(urls).toContain(`${SITE.url}/sobre`);
    expect(urls).toContain(`${SITE.url}/extensao`);
    expect(urls).toContain(`${SITE.url}/termos`);
  });

  it('should_include_course_routes_from_catalog', async () => {
    const routes = await sitemap();
    const courseUrls = routes.map((r) => r.url).filter((u) => u.includes('/cursos/'));
    expect(courseUrls.length).toBeGreaterThan(10);
    expect(courseUrls).toContain(`${SITE.url}/cursos/python`);
    for (const url of courseUrls) {
      expect(url).toMatch(new RegExp(`^${SITE.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/cursos/[a-z0-9-]+$`));
    }
  });

  it('should_use_fixed_last_modified_date', async () => {
    const routes = await sitemap();
    expect(routes[0].lastModified).toBe('2026-08-04');
  });
});