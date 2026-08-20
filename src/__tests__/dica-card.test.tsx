// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    primary: '#020617',
    accent: '#ccff00',
    surface: '#ffffff',
    shadow: '3px 3px 0px #000',
    fontMono: 'ui-monospace, monospace',
  },
}));

vi.mock('@/lib/core/dicas/dica-catalog', () => ({
  DICA_CATEGORIES: {
    curriculo: { label: 'Curriculo', description: 'Dicas para curriculo' },
    ferramenta: { label: 'Ferramentas', description: 'Tutoriais' },
    carreira: { label: 'Carreira', description: 'Conselhos' },
    ats: { label: 'ATS', description: 'Filtros automaticos' },
  },
}));

import { DicaCard } from '@/components/dicas/dica-card';

const mockDica = {
  slug: 'como-escrever-curriculo',
  title: 'Como escrever um curriculo eficaz',
  shortTitle: 'CURRICULO EFICAZ',
  description: 'Dicas para escrever um curriculo que passa nos filtros ATS.',
  category: 'curriculo' as const,
  publishDate: '2026-01-01',
  estimatedReadingMinutes: 5,
  sections: [],
  faq: [],
};

describe('DicaCard', () => {
  it('should_render_dica_title', () => {
    render(<DicaCard dica={mockDica} />);
    expect(screen.getByText('CURRICULO EFICAZ')).toBeTruthy();
  });

  it('should_render_dica_description', () => {
    render(<DicaCard dica={mockDica} />);
    expect(screen.getByText(/Dicas para escrever um curriculo/)).toBeTruthy();
  });

  it('should_render_category_badge', () => {
    render(<DicaCard dica={mockDica} />);
    expect(screen.getByText('Curriculo')).toBeTruthy();
  });

  it('should_render_estimated_reading_minutes', () => {
    render(<DicaCard dica={mockDica} />);
    expect(screen.getByText('5 min')).toBeTruthy();
  });

  it('should_link_to_correct_slug', () => {
    render(<DicaCard dica={mockDica} />);
    const link = screen.getByRole('link', { name: /LER DICA/i });
    expect(link.getAttribute('href')).toBe('/dicas/como-escrever-curriculo');
  });

  it('should_render_different_category_label', () => {
    const dica = { ...mockDica, category: 'ats' as const };
    render(<DicaCard dica={dica} />);
    expect(screen.getByText('ATS')).toBeTruthy();
  });
});
