// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SnackbarProvider, useSnackbar } from '@/hooks/useSnackbar';

function TestButton() {
  const { show } = useSnackbar();
  return <button onClick={() => show('Test message', 'success')}>SHOW</button>;
}

describe('SnackbarProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_show_snackbar_when_show_is_called', () => {
    render(<SnackbarProvider><TestButton /></SnackbarProvider>);
    fireEvent.click(screen.getByText('SHOW'));
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should_render_children', () => {
    render(<SnackbarProvider><div>Child</div></SnackbarProvider>);
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('should_show_snackbar_with_custom_duration', () => {
    function CustomButton() {
      const { show } = useSnackbar();
      return <button onClick={() => show('Custom', 'error', { duration: 8000 })}>CUSTOM</button>;
    }
    render(<SnackbarProvider><CustomButton /></SnackbarProvider>);
    fireEvent.click(screen.getByText('CUSTOM'));
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('should_auto_hide_after_default_duration_of_4s', () => {
    // O auto-hide do Snackbar usa o timer interno do MUI — advanceTimersByTime
    // dispara tanto o autoHideDuration quanto a transição de saída.
    vi.useFakeTimers();
    render(<SnackbarProvider><TestButton /></SnackbarProvider>);

    fireEvent.click(screen.getByText('SHOW'));
    expect(screen.getByText('Test message')).toBeTruthy();

    // Antes de 4s continua visível (valida o default ?? 4000)
    act_advance(3990);
    expect(screen.queryByText('Test message')).toBeTruthy();

    act_advance(20);
    expect(screen.queryByText('Test message')).toBeNull();
  });

  it('should_close_via_alert_close_button', () => {
    render(<SnackbarProvider><TestButton /></SnackbarProvider>);
    fireEvent.click(screen.getByText('SHOW'));
    expect(screen.getByText('Test message')).toBeTruthy();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Test message')).toBeNull();
  });
});

function act_advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
