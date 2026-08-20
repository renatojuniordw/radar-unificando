// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';

describe('BreadcrumbSchema', () => {
  const sampleItems = [
    { name: 'Inicio', url: 'https://radar.unificando.com.br' },
    { name: 'Vagas', url: 'https://radar.unificando.com.br/vagas' },
    { name: 'React', url: 'https://radar.unificando.com.br/vagas?q=react' },
  ];

  it('should render a script tag with type application/ld+json', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should have @type BreadcrumbList and correct @context', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@type']).toBe('BreadcrumbList');
    expect(content['@context']).toBe('https://schema.org');
  });

  it('should render correct number of itemListElement entries', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.itemListElement).toHaveLength(3);
  });

  it('should assign sequential positions starting from 1', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.itemListElement.forEach((item: { position: number }, index: number) => {
      expect(item.position).toBe(index + 1);
    });
  });

  it('should include correct name and url for each item', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.itemListElement.forEach(
      (item: { name: string; item: string }, index: number) => {
        expect(item.name).toBe(sampleItems[index].name);
        expect(item.item).toBe(sampleItems[index].url);
      }
    );
  });

  it('should use @type ListItem for each entry', () => {
    const { container } = render(<BreadcrumbSchema items={sampleItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.itemListElement.forEach((item: { '@type': string }) => {
      expect(item['@type']).toBe('ListItem');
    });
  });

  it('should handle a single item', () => {
    const singleItem = [{ name: 'Home', url: 'https://example.com' }];
    const { container } = render(<BreadcrumbSchema items={singleItem} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.itemListElement).toHaveLength(1);
    expect(content.itemListElement[0].position).toBe(1);
  });

  it('should handle empty items array', () => {
    const { container } = render(<BreadcrumbSchema items={[]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.itemListElement).toEqual([]);
  });
});
