// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
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
    const { redirect } = await import('next/navigation');
    mockAuth.mockResolvedValue(null);
    const DashboardLayout = (await import('@/app/(dashboard)/layout')).default;
    await DashboardLayout({ children: <div>Protected</div> });
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should_render_children_when_authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } } as any);
    const DashboardLayout = (await import('@/app/(dashboard)/layout')).default;
    const result = await DashboardLayout({ children: <div>Protected</div> });
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain('Protected');
  });
});
