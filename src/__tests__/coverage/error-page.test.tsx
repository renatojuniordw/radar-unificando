// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';

describe('ErrorPage', () => {
  it('should_render_error_message', () => {
    const error = new Error('Algo quebrou');
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(screen.getByText('Erro inesperado')).toBeTruthy();
    expect(screen.getByText('Algo quebrou')).toBeTruthy();
  });

  it('should_render_default_message_when_error_is_empty', () => {
    const error = new Error();
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(screen.getByText('Tente novamente')).toBeTruthy();
  });

  it('should_call_reset_on_button_click', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('Oops')} reset={reset} />);
    fireEvent.click(screen.getByText('TENTAR NOVAMENTE'));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
