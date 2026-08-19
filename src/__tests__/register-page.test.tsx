// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useRouterMock } = vi.hoisted(() => ({ useRouterMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: useRouterMock }));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock('@/components/ui/password-strength-meter', () => ({
  PasswordStrengthMeter: () => <div>força da senha</div>,
}));

import RegisterPage from '@/app/(auth)/register/page';

describe('RegisterPage', () => {
  const push = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fillValid() {
    fireEvent.change(screen.getByLabelText('Nome Completo'), { target: { value: 'Maria Silva' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@2026' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: 'Senha@2026' } });
  }

  function submit() {
    fireEvent.submit(screen.getByRole('button', { name: /CRIAR CONTA/i }).closest('form')!);
  }

  it('should_render_register_form', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'CRIAR CONTA' })).toBeTruthy();
    expect(screen.getByLabelText('Nome Completo')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar Senha')).toBeTruthy();
    expect(screen.getByText('ENTRAR AGORA')).toBeTruthy();
  });

  it('should_show_validation_errors_for_invalid_input', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalido' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'fraca' } });
    submit();
    expect(screen.getByText(/Email inválido/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should_show_mismatch_error', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Nome Completo'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@2026' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: 'Outra@2026' } });
    submit();
    expect(screen.getByText(/Senhas não coincidem/)).toBeTruthy();
  });

  it('should_register_and_redirect_to_login', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    render(<RegisterPage />);
    fillValid();
    submit();
    await screen.findByText('CRIAR CONTA');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Maria Silva', email: 'maria@test.com', password: 'Senha@2026' }),
    }));
    expect(push).toHaveBeenCalledWith('/login?registered=true');
  });

  it('should_show_api_error_from_response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Email já cadastrado' }) });
    render(<RegisterPage />);
    fillValid();
    submit();
    expect(await screen.findByText(/Email já cadastrado/)).toBeTruthy();
  });

  it('should_show_default_error_when_fetch_fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<RegisterPage />);
    fillValid();
    submit();
    expect(await screen.findByText(/Erro ao criar conta/)).toBeTruthy();
  });

  it('should_toggle_password_visibility', () => {
    render(<RegisterPage />);
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar senha'));
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('text');
    fireEvent.click(screen.getByLabelText('Mostrar confirmação de senha'));
    expect((screen.getByLabelText('Confirmar Senha') as HTMLInputElement).type).toBe('text');
  });
});