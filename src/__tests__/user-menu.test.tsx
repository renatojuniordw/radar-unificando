// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useSessionMock, signOutMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signOut: signOutMock,
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import { UserMenu } from '@/components/layout/user-menu';

const SESSION = {
  user: { name: 'Maria Silva', email: 'maria@test.com', role: 'user' },
};

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  it('should_show_login_and_register_links_when_no_session', () => {
    render(<UserMenu />);
    expect(screen.getByText('ENTRAR')).toBeTruthy();
    expect(screen.getByText('CRIAR CONTA')).toBeTruthy();
  });

  it('should_show_first_name_when_authenticated', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    expect(screen.getByText('Maria')).toBeTruthy();
  });

  it('should_open_dropdown_on_click', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Maria/i }));
    expect(screen.getByText('MEU PERFIL')).toBeTruthy();
    expect(screen.getByText('CONECTAR EXTENSÃO')).toBeTruthy();
    expect(screen.getByText('SAIR DA CONTA')).toBeTruthy();
  });

  it('should_show_admin_link_for_admin_role', () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Admin', email: 'a@b.com', role: 'admin' } },
      status: 'authenticated',
    });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Admin/i }));
    expect(screen.getByText('PAINEL ADMIN')).toBeTruthy();
  });

  it('should_not_show_admin_link_for_non_admin', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Maria/i }));
    expect(screen.queryByText('PAINEL ADMIN')).toBeNull();
  });

  it('should_call_sign_out_when_clicking_logout', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Maria/i }));
    fireEvent.click(screen.getByText('SAIR DA CONTA'));
    expect(signOutMock).toHaveBeenCalled();
  });

  it('should_close_dropdown_on_escape', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Maria/i }));
    expect(screen.getByText('MEU PERFIL')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('MEU PERFIL')).toBeNull();
  });

  it('should_close_dropdown_when_clicking_outside', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Maria/i }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('MEU PERFIL')).toBeNull();
  });

  it('should_fallback_to_email_username_when_no_name', () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: 'joao@test.com' } },
      status: 'authenticated',
    });
    render(<UserMenu />);
    expect(screen.getByText('joao')).toBeTruthy();
  });

  it('should_fallback_to_usuario_when_no_identity', () => {
    useSessionMock.mockReturnValue({ data: { user: {} }, status: 'authenticated' });
    render(<UserMenu />);
    expect(screen.getByText('Usuário')).toBeTruthy();
  });
});