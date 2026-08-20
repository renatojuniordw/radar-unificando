// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredData } from '@/components/seo/structured-data';
import { SITE } from '@/lib/core/constants';

describe('StructuredData', () => {
  it('should render three script tags with type application/ld+json', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(3);
  });

  it('should render a WebSite schema', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const websiteScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'WebSite';
    });
    expect(websiteScript).toBeDefined();
    const content = JSON.parse(websiteScript!.innerHTML || '{}');
    expect(content['@type']).toBe('WebSite');
    expect(content['@context']).toBe('https://schema.org');
    expect(content.name).toBe('Radar Unificando');
    expect(content.url).toBe(SITE.url);
    expect(content.inLanguage).toBe('pt-BR');
  });

  it('should render an Organization schema', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const orgScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'Organization';
    });
    expect(orgScript).toBeDefined();
    const content = JSON.parse(orgScript!.innerHTML || '{}');
    expect(content['@type']).toBe('Organization');
    expect(content.name).toBe('Radar Unificando');
    expect(content.url).toBe(SITE.url);
    expect(content.logo).toBe(SITE.logo);
  });

  it('should render a WebApplication schema', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const webAppScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'WebApplication';
    });
    expect(webAppScript).toBeDefined();
    const content = JSON.parse(webAppScript!.innerHTML || '{}');
    expect(content['@type']).toBe('WebApplication');
    expect(content.applicationCategory).toBe('BusinessApplication');
    expect(content.operatingSystem).toBe('All');
  });

  it('WebSite schema should have potentialAction with SearchAction', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const websiteScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'WebSite';
    });
    const content = JSON.parse(websiteScript!.innerHTML || '{}');
    expect(content.potentialAction['@type']).toBe('SearchAction');
    expect(content.potentialAction.target.urlTemplate).toContain('{search_term_string}');
  });

  it('WebApplication schema should have offers with price 0', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const webAppScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'WebApplication';
    });
    const content = JSON.parse(webAppScript!.innerHTML || '{}');
    expect(content.offers.price).toBe('0.00');
    expect(content.offers.priceCurrency).toBe('BRL');
  });

  it('Organization schema should have description', () => {
    const { container } = render(<StructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const orgScript = Array.from(scripts).find((s) => {
      const content = JSON.parse(s.innerHTML || '{}');
      return content['@type'] === 'Organization';
    });
    const content = JSON.parse(orgScript!.innerHTML || '{}');
    expect(content.description).toBeTruthy();
  });
});
