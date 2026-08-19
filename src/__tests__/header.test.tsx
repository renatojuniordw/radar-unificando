// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock('@/components/layout/user-menu', () => ({
  UserMenu: () => <div>USER MENU</div>,
}));
vi.mock('@/components/layout/mobile-nav', () => ({
  MobileNav: ({ isOpen, onClose }: any) => (
    <div>
      <span data-testid="mobile-open">{String(isOpen)}</span>
      <button onClick={onClose}>fechar nav</button>
    </div>
  ),
}));

import { Header } from '@/components/layout/header';

describe('Header', () => {
  it('should_render_brand', () => {
    render(<Header />);
    expect(screen.getByText('RADAR')).toBeTruthy();
    expect(screen.getByText('UNIFICANDO')).toBeTruthy();
  });

  it('should_render_nav_links_from_config', () => {
    render(<Header />);
    const links = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(links).toContain('/');
    expect(links).toContain('/cursos');
  });

  it('should_render_user_menu', () => {
    render(<Header />);
    expect(screen.getByText('USER MENU')).toBeTruthy();
  });

  it('should_toggle_mobile_nav_on_hamburger_click', () => {
    render(<Header />);
    expect(screen.getByTestId('mobile-open').textContent).toBe('false');
    fireEvent.click(screen.getByLabelText('Abrir menu principal'));
    expect(screen.getByTestId('mobile-open').textContent).toBe('true');
    fireEvent.click(screen.getByLabelText('Abrir menu principal'));
    expect(screen.getByTestId('mobile-open').textContent).toBe('false');
  });

  it('should_close_mobile_nav_via_on_close', () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText('Abrir menu principal'));
    fireEvent.click(screen.getByText('fechar nav'));
    expect(screen.getByTestId('mobile-open').textContent).toBe('false');
  });
});