// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/lib/infrastructure/ui/auth-provider';
import { useSession } from 'next-auth/react';

const { SessionProviderMock, useSessionMock } = vi.hoisted(() => ({
  SessionProviderMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: (props: any) => {
    SessionProviderMock(props);
    return props.children;
  },
  useSession: () => useSessionMock(),
}));

function SessionConsumer() {
  const { data, status } = useSession();
  if (status === 'loading') {
    return <div>loading</div>;
  }
  if (status === 'authenticated') {
    return <div>{data?.user?.name ?? 'anonymous'}</div>;
  }
  return <div>unauthenticated</div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_render_children', () => {
    render(
      <AuthProvider>
        <div>child-content</div>
      </AuthProvider>,
    );
    expect(screen.getByText('child-content')).toBeTruthy();
  });

  it('should_wrap_children_in_session_provider', () => {
    render(
      <AuthProvider>
        <span>nested-child</span>
      </AuthProvider>,
    );
    expect(SessionProviderMock).toHaveBeenCalledTimes(1);
    expect(SessionProviderMock.mock.calls[0][0].children).toBeTruthy();
  });

  it('should_pass_only_children_prop_to_session_provider', () => {
    render(
      <AuthProvider>
        <span>x</span>
      </AuthProvider>,
    );
    expect(Object.keys(SessionProviderMock.mock.calls[0][0])).toEqual(['children']);
  });

  it('should_expose_session_state_to_consumer_children', () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Maria Silva' } },
      status: 'authenticated',
    });

    render(
      <AuthProvider>
        <SessionConsumer />
      </AuthProvider>,
    );
    expect(screen.getByText('Maria Silva')).toBeTruthy();
  });
});