// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

import NotFound from '@/app/not-found';

describe('NotFound', () => {
  it('should_render_404_text', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeTruthy();
  });

  it('should_render_error_label', () => {
    render(<NotFound />);
    expect(screen.getByText('ERRO 404 — ROTA NÃO ENCONTRADA')).toBeTruthy();
  });

  it('should_render_heading', () => {
    render(<NotFound />);
    expect(screen.getByText('Vaga ou página encerrada')).toBeTruthy();
  });

  it('should_render_description', () => {
    render(<NotFound />);
    expect(screen.getByText(/O endereço digitado não existe/)).toBeTruthy();
  });

  it('should_render_home_link', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /Voltar para a Busca de Vagas/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/');
  });
});
