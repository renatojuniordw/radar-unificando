// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnackbarProvider, useSnackbar } from '@/hooks/useSnackbar';

function TestButton() {
  const { show } = useSnackbar();
  return <button onClick={() => show('Test message', 'success')}>SHOW</button>;
}

describe('SnackbarProvider', () => {
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
});
