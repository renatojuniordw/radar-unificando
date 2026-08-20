// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminNav } from '@/components/admin/admin-nav';

vi.mock('next/link', () => ({
  default: ({ href, children, style }: any) => <a href={href} style={style}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin',
}));

describe('AdminNav', () => {
  it('should render all navigation items', () => {
    render(<AdminNav />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Usuários')).toBeTruthy();
  });

  it('should render links with correct hrefs', () => {
    render(<AdminNav />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const usersLink = screen.getByText('Usuários').closest('a');

    expect(dashboardLink?.getAttribute('href')).toBe('/admin');
    expect(usersLink?.getAttribute('href')).toBe('/admin/usuarios');
  });

  it('should highlight active route', () => {
    render(<AdminNav />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const usersLink = screen.getByText('Usuários').closest('a');

    // Dashboard should have active background color (#ccff00)
    expect(dashboardLink?.getAttribute('style')).toContain('rgb(204, 255, 0)');
    // Users should have inactive background color (#ffffff)
    expect(usersLink?.getAttribute('style')).toContain('rgb(255, 255, 255)');
  });

  it('should apply correct styling to links', () => {
    render(<AdminNav />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('style')).toContain('text-transform');
      expect(link.getAttribute('style')).toContain('font-weight');
    });
  });
});
