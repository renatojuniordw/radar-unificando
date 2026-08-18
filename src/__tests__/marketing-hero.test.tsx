// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useRouterMock } = vi.hoisted(() => ({ useRouterMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: useRouterMock }));

import { MarketingHero } from '@/components/home/marketing-hero';

describe('MarketingHero', () => {
  const push = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push });
  });

  it('should_render_title_and_badge', () => {
    render(<MarketingHero />);
    expect(screen.getByText('RADAR DE VAGAS')).toBeTruthy();
    expect(screen.getByText('GUPY + INHIRE · BUSCA EM TEMPO REAL')).toBeTruthy();
  });

  it('should_redirect_to_search_with_query_when_roles_selected', () => {
    const { container } = render(<MarketingHero />);
    const input = screen.getByPlaceholderText(/Digite o cargo desejado/);
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.submit(container.querySelector('form')!);
    expect(push).toHaveBeenCalledWith('/busca?q=Python');
  });

  it('should_redirect_to_search_without_query_when_no_roles', () => {
    const { container } = render(<MarketingHero />);
    fireEvent.submit(container.querySelector('form')!);
    expect(push).toHaveBeenCalledWith('/busca');
  });

  it('should_render_how_it_works_steps', () => {
    render(<MarketingHero />);
    expect(screen.getByText('PESQUISE VAGAS')).toBeTruthy();
    expect(screen.getByText('ANÁLISE DE SCORE ATS')).toBeTruthy();
    expect(screen.getByText('ADAPTE E CANDIDATE-SE')).toBeTruthy();
  });

  it('should_render_popular_suggestion_tags', () => {
    render(<MarketingHero />);
    expect(screen.getByText('+ DevOps')).toBeTruthy();
    expect(screen.getByText('+ Python')).toBeTruthy();
  });
});