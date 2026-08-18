// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';

describe('ForgotPasswordPage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fillEmail(value: string) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value } });
  }

  function submit() {
    fireEvent.submit(screen.getByRole('button', { name: /ENVIAR LINK/i }).closest('form')!);
  }

  it('should_render_form', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('ESQUECEU A SENHA?')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('button', { name: /ENVIAR LINK/i })).toBeTruthy();
  });

  it('should_show_email_validation_error', () => {
    render(<ForgotPasswordPage />);
    fillEmail('invalido');
    submit();
    expect(screen.getByText(/Email inválido/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should_show_success_state_when_email_sent', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    render(<ForgotPasswordPage />);
    fillEmail('ana@test.com');
    submit();
    expect(await screen.findByText('EMAIL ENVIADO')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'ana@test.com' }),
    }));
  });

  it('should_show_api_error_from_response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Email não encontrado' }) });
    render(<ForgotPasswordPage />);
    fillEmail('ana@test.com');
    submit();
    expect(await screen.findByText(/Email não encontrado/)).toBeTruthy();
  });

  it('should_show_default_error_when_response_has_no_detail', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => null });
    render(<ForgotPasswordPage />);
    fillEmail('ana@test.com');
    submit();
    expect(await screen.findByText(/Erro ao processar a solicitação/)).toBeTruthy();
  });

  it('should_show_error_when_fetch_throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<ForgotPasswordPage />);
    fillEmail('ana@test.com');
    submit();
    expect(await screen.findByText(/Erro ao processar a solicitação/)).toBeTruthy();
  });
});