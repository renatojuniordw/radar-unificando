// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }));
const { useRouterMock } = vi.hoisted(() => ({ useRouterMock: vi.fn() }));
vi.mock('next-auth/react', () => ({ signIn: signInMock }));
vi.mock('next/navigation', () => ({ useRouter: useRouterMock }));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import { LoginForm } from '@/app/(auth)/login/login-form';

describe('LoginForm', () => {
  const push = vi.fn();
  const refresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push, refresh });
  });

  function renderForm() {
    return render(<LoginForm callbackUrl="/busca" />);
  }

  function fillValid() {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura1' } });
  }

  function submit() {
    const form = screen.getByRole('button', { name: /ENTRAR/i }).closest('form')!;
    fireEvent.submit(form);
    return form;
  }

  it('should_render_login_form_elements', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /ENTRAR/i })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByText('Esqueci minha senha?')).toBeTruthy();
    expect(screen.getByText('CRIAR MINHA CONTA GRÁTIS')).toBeTruthy();
  });

  it('should_show_email_validation_error', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalido' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura1' } });
    submit();
    expect(screen.getByText(/Email inválido/)).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('should_show_password_validation_error', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'curta' } });
    submit();
    expect(screen.getByText(/Mínimo de 8 caracteres/)).toBeTruthy();
  });

  it('should_redirect_on_successful_login', async () => {
    signInMock.mockResolvedValue({ error: null });
    renderForm();
    fillValid();
    submit();
    await screen.findByText('ENTRAR');
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      email: 'ana@test.com',
      password: 'senhaSegura1',
      redirect: false,
    });
    expect(push).toHaveBeenCalledWith('/busca');
    expect(refresh).toHaveBeenCalled();
  });

  it('should_show_generic_error_when_credentials_invalid', async () => {
    signInMock.mockResolvedValue({ error: 'Invalid credentials' });
    renderForm();
    fillValid();
    submit();
    expect(await screen.findByText(/Email ou senha inválidos/)).toBeTruthy();
  });

  it('should_show_rate_limit_message', async () => {
    signInMock.mockResolvedValue({ error: 'RATE_LIMITED' });
    renderForm();
    fillValid();
    submit();
    expect(await screen.findByText(/Muitas tentativas de login/)).toBeTruthy();
  });

  it('should_show_login_error_when_sign_in_throws', async () => {
    signInMock.mockRejectedValue(new Error('network'));
    renderForm();
    fillValid();
    submit();
    expect(await screen.findByText(/Erro ao fazer login/)).toBeTruthy();
  });

  it('should_toggle_password_visibility', () => {
    renderForm();
    const senha = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(senha.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar senha'));
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('text');
    fireEvent.click(screen.getByLabelText('Ocultar senha'));
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('password');
  });
});