// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/infrastructure/ui/theme-provider', () => ({
  useThemeMode: vi.fn(() => ({ mode: 'dark', toggle: vi.fn() })),
}));

import { useSession } from 'next-auth/react';

describe('Footer', () => {
  it('should_render_brand_and_links', async () => {
    const { Footer } = await import('@/components/layout/footer');
    const { container } = render(<Footer />);
    expect(container.textContent).toContain('RADAR UNIFICANDO');
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);
  });

  it('should_render_brand_and_entrar_when_anonymous', async () => {
    const { Header } = await import('@/components/layout/header');
    const { container } = render(<Header />);
    expect(container.textContent).toContain('RADAR UNIFICANDO');
    expect(container.textContent).toContain('ENTRAR');
  });

  it('should_render_nav_and_sair_when_logged_in', async () => {
    vi.mocked(useSession).mockReturnValue({ data: { user: { email: 'user@test.com' } }, status: 'authenticated' } as any);
    const { Header } = await import('@/components/layout/header');
    const { container } = render(<Header />);
    expect(container.textContent).toContain('PERFIL');
    expect(container.textContent).toContain('MATCH');
    expect(container.textContent).toContain('CANDIDATURAS');
    expect(container.textContent).toContain('SAIR');
    expect(container.textContent).toContain('user@test.com');
  });
});
