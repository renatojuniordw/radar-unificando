// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useRouterMock } = vi.hoisted(() => ({ useRouterMock: vi.fn() }));
const { useSearchParamsMock } = vi.hoisted(() => ({ useSearchParamsMock: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: useRouterMock,
  useSearchParams: useSearchParamsMock,
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock('@/components/ui/password-strength-meter', () => ({
  PasswordStrengthMeter: () => <div>força da senha</div>,
}));

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

describe('ResetPasswordPage', () => {
  const push = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push });
    useSearchParamsMock.mockReturnValue({ get: (k: string) => (k === 'token' ? 'tok-123' : null) });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fillValidPasswords() {
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'Senha@2026' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'Senha@2026' } });
  }

  function submit() {
    fireEvent.submit(screen.getByRole('button', { name: /REDEFINIR SENHA/i }).closest('form')!);
  }

  it('should_show_invalid_link_state_without_token', () => {
    useSearchParamsMock.mockReturnValue({ get: () => null });
    render(<ResetPasswordPage />);
    expect(screen.getByText('LINK INVÁLIDO')).toBeTruthy();
    expect(screen.getByText('SOLICITAR NOVO LINK')).toBeTruthy();
  });

  it('should_show_password_strength_errors', () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'fraca' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'fraca' } });
    submit();
    // zodFieldErrors mostra apenas o primeiro erro por campo
    expect(screen.getByText(/Mínimo de 8 caracteres/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should_show_mismatch_error', () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'Senha@2026' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'Outra@2026' } });
    submit();
    expect(screen.getByText(/Senhas não coincidem/)).toBeTruthy();
  });

  it('should_reset_password_and_redirect', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    render(<ResetPasswordPage />);
    fillValidPasswords();
    submit();
    await screen.findByText('REDEFINIR SENHA');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'tok-123', password: 'Senha@2026' }),
    }));
    expect(push).toHaveBeenCalledWith('/login?reset=true');
  });

  it('should_show_api_error_from_response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Token expirado' }) });
    render(<ResetPasswordPage />);
    fillValidPasswords();
    submit();
    expect(await screen.findByText(/Token expirado/)).toBeTruthy();
  });

  it('should_show_error_when_fetch_throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<ResetPasswordPage />);
    fillValidPasswords();
    submit();
    expect(await screen.findByText(/Erro ao redefinir a senha/)).toBeTruthy();
  });

  it('should_toggle_password_visibility', () => {
    render(<ResetPasswordPage />);
    expect((screen.getByLabelText('Nova Senha') as HTMLInputElement).type).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar senha'));
    expect((screen.getByLabelText('Nova Senha') as HTMLInputElement).type).toBe('text');
    fireEvent.click(screen.getByLabelText('Mostrar confirmação de senha'));
    expect((screen.getByLabelText('Confirmar Nova Senha') as HTMLInputElement).type).toBe('text');
    fireEvent.click(screen.getByLabelText('Ocultar confirmação de senha'));
    expect((screen.getByLabelText('Confirmar Nova Senha') as HTMLInputElement).type).toBe('password');
  });
});