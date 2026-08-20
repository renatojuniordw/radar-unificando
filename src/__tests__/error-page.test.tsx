// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import ErrorPage from '@/app/error';

describe('ErrorPage', () => {
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should_render_error_heading', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('should_render_error_description', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByText('Ocorreu um erro inesperado. Tente novamente.')).toBeTruthy();
  });

  it('should_render_retry_button', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByRole('button', { name: /TENTAR NOVAMENTE/i })).toBeTruthy();
  });

  it('should_call_reset_when_button_clicked', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={mockReset} />);
    const button = screen.getByRole('button', { name: /TENTAR NOVAMENTE/i });
    fireEvent.click(button);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should_call_console_error_on_mount', () => {
    const error = new Error('Test error message');
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Erro não tratado na aplicação:', error);
  });

  it('should_have_alert_role', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
