// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';

describe('ErrorPage', () => {
  it('should_render_generic_error_message', () => {
    const error = new Error('Algo quebrou');
    render(<ErrorPage error={error} reset={vi.fn()} />);
    // Não expõe error.message (evita vazar detalhes técnicos/digest em produção)
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
    expect(screen.queryByText('Algo quebrou')).toBeNull();
  });

  it('should_render_retry_message_when_error_is_empty', () => {
    const error = new Error();
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(screen.getByText('Ocorreu um erro inesperado. Tente novamente.')).toBeTruthy();
  });

  it('should_call_reset_on_button_click', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('Oops')} reset={reset} />);
    fireEvent.click(screen.getByText('TENTAR NOVAMENTE'));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
