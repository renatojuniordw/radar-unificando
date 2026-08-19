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

import { MobileNav } from '@/components/layout/mobile-nav';

const SESSION = {
  user: { name: 'Maria Silva', email: 'maria@test.com' },
};

describe('MobileNav', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    document.body.style.overflow = '';
  });

  it('should_render_nothing_when_closed', () => {
    const { container } = render(<MobileNav isOpen={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('should_render_navigation_when_open', () => {
    render(<MobileNav isOpen onClose={onClose} />);
    expect(screen.getByText('NAVEGAÇÃO PRINCIPAL')).toBeTruthy();
    expect(screen.getByText('ENTRAR')).toBeTruthy();
    expect(screen.getByText('CRIAR CONTA')).toBeTruthy();
  });

  it('should_lock_body_scroll_while_open_and_restore_on_close', () => {
    const { rerender } = render(<MobileNav isOpen onClose={onClose} />);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<MobileNav isOpen={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('should_close_on_backdrop_click', () => {
    render(<MobileNav isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Fechar menu'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should_close_on_escape_key', () => {
    render(<MobileNav isOpen onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('should_show_user_card_and_logout_when_authenticated', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<MobileNav isOpen onClose={onClose} />);
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    fireEvent.click(screen.getByText('SAIR DA CONTA'));
    expect(signOutMock).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should_show_initial_letter_when_no_image', () => {
    useSessionMock.mockReturnValue({ data: SESSION, status: 'authenticated' });
    render(<MobileNav isOpen onClose={onClose} />);
    expect(screen.getByText('M')).toBeTruthy();
  });

  it('should_render_terms_link', () => {
    render(<MobileNav isOpen onClose={onClose} />);
    expect(screen.getByText('TERMOS & PRIVACIDADE')).toBeTruthy();
  });

  it('should_render_ecosystem_link', () => {
    render(<MobileNav isOpen onClose={onClose} />);
    expect(screen.getByText('Ecossistema Unificando')).toBeTruthy();
  });
});