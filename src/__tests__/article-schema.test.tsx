// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ArticleSchema } from '@/components/seo/article-schema';
import { SITE } from '@/lib/core/constants';

describe('ArticleSchema', () => {
  const defaultProps = {
    title: 'Como otimizar seu currículo para ATS',
    description: 'Dicas práticas para passar em triagens automatizadas.',
    url: 'https://radar.unificando.com.br/dicas/otimizar-curriculo',
    datePublished: '2026-08-15',
  };

  it('should render a script tag with type application/ld+json', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should include the headline from title prop', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.headline).toBe(defaultProps.title);
  });

  it('should include the description', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.description).toBe(defaultProps.description);
  });

  it('should include datePublished', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.datePublished).toBe('2026-08-15');
  });

  it('should default dateModified to datePublished when not provided', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.dateModified).toBe('2026-08-15');
  });

  it('should use provided dateModified when given', () => {
    const { container } = render(
      <ArticleSchema {...defaultProps} dateModified="2026-08-20" />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.dateModified).toBe('2026-08-20');
  });

  it('should default authorName to Radar Unificando', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.author.name).toBe('Radar Unificando');
  });

  it('should use custom authorName when provided', () => {
    const { container } = render(
      <ArticleSchema {...defaultProps} authorName="Renato Bezerra" />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.author.name).toBe('Renato Bezerra');
  });

  it('should default image to SITE.logo', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.image).toBe(SITE.logo);
  });

  it('should use custom image when provided', () => {
    const customImage = 'https://example.com/image.png';
    const { container } = render(
      <ArticleSchema {...defaultProps} image={customImage} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.image).toBe(customImage);
  });

  it('should have @type Article and correct @context', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@type']).toBe('Article');
    expect(content['@context']).toBe('https://schema.org');
  });

  it('should include url', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.url).toBe(defaultProps.url);
  });

  it('should include publisher organization', () => {
    const { container } = render(<ArticleSchema {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.publisher['@type']).toBe('Organization');
    expect(content.publisher.name).toBe('Radar Unificando');
    expect(content.publisher.url).toBe(SITE.url);
    expect(content.publisher.logo.url).toBe(SITE.logo);
  });
});
