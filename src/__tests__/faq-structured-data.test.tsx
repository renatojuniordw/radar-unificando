// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FaqStructuredData } from '@/components/seo/faq-structured-data';
import { FAQ_ITEMS } from '@/lib/constants/home';

vi.mock('@/lib/constants/home', () => ({
  FAQ_ITEMS: [
    { q: 'Pergunta 1?', a: 'Resposta 1.' },
    { q: 'Pergunta 2?', a: 'Resposta 2.' },
  ],
}));

describe('FaqStructuredData', () => {
  it('should render a script tag with type application/ld+json', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should have @type FAQPage and correct @context', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@type']).toBe('FAQPage');
    expect(content['@context']).toBe('https://schema.org');
  });

  it('should render mainEntity as an array of questions', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(Array.isArray(content.mainEntity)).toBe(true);
    expect(content.mainEntity).toHaveLength(2);
  });

  it('each mainEntity item should have @type Question', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.mainEntity.forEach((entity: { '@type': string }) => {
      expect(entity['@type']).toBe('Question');
    });
  });

  it('each question should have a name matching the q field', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.mainEntity.forEach(
      (entity: { name: string }, index: number) => {
        expect(entity.name).toBe(FAQ_ITEMS[index].q);
      }
    );
  });

  it('each question should have acceptedAnswer with @type Answer and text', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.mainEntity.forEach(
      (
        entity: { acceptedAnswer: { '@type': string; text: string } },
        index: number
      ) => {
        expect(entity.acceptedAnswer['@type']).toBe('Answer');
        expect(entity.acceptedAnswer.text).toBe(FAQ_ITEMS[index].a);
      }
    );
  });

  it('should render as many questions as there are in FAQ_ITEMS', () => {
    const { container } = render(<FaqStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.mainEntity.length).toBe(FAQ_ITEMS.length);
  });
});
