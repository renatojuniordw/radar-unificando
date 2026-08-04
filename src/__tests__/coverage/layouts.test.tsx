// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('AuthLayout', () => {
  it('should_render_children', async () => {
    const AuthLayout = (await import('@/app/(auth)/layout')).default;
    const { container } = render(<AuthLayout><div>Auth Content</div></AuthLayout>);
    expect(container.textContent).toContain('Auth Content');
  });
});

describe('DashboardLayout', () => {
  it('should_redirect_when_not_authenticated', async () => {
    const { auth } = await import('@/auth');
    const { redirect } = await import('next/navigation');
    vi.mocked(auth).mockResolvedValue(null);
    const DashboardLayout = (await import('@/app/(dashboard)/layout')).default;
    await DashboardLayout({ children: <div>Protected</div> });
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should_render_children_when_authenticated', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } } as any);
    const DashboardLayout = (await import('@/app/(dashboard)/layout')).default;
    const result = await DashboardLayout({ children: <div>Protected</div> });
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain('Protected');
  });
});
