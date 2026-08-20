// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
}));

import { MobileFloatingBar } from '@/components/layout/mobile-floating-bar';

describe('MobileFloatingBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  it('should_render_bar_on_home_page', () => {
    render(<MobileFloatingBar />);
    expect(screen.getByText('BUSCAR VAGAS AGORA')).toBeTruthy();
  });

  it('should_render_search_link_to_busca', () => {
    render(<MobileFloatingBar />);
    const link = screen.getByRole('link', { name: /BUSCAR VAGAS AGORA/i });
    expect(link.getAttribute('href')).toBe('/busca');
  });

  it('should_render_close_button', () => {
    render(<MobileFloatingBar />);
    expect(screen.getByRole('button', { name: /Fechar barra de atalho/i })).toBeTruthy();
  });

  it('should_hide_bar_when_close_button_clicked', () => {
    render(<MobileFloatingBar />);
    const closeBtn = screen.getByRole('button', { name: /Fechar barra de atalho/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('BUSCAR VAGAS AGORA')).toBeNull();
  });

  it('should_not_render_on_busca_page', () => {
    mockUsePathname.mockReturnValue('/busca');
    const { container } = render(<MobileFloatingBar />);
    expect(container.innerHTML).toBe('');
  });
});
