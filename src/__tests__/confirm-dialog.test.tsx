// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('ConfirmDialog', () => {
  it('should_render_title_and_message', () => {
    render(<ConfirmDialog open title="Delete?" message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Delete?')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('should_call_on_confirm_when_confirm_button_clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Test" message="Test" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should_call_on_cancel_when_cancel_button_clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Test" message="Test" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should_use_custom_button_labels', () => {
    render(<ConfirmDialog open title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} confirmLabel="Yes" cancelLabel="No" />);
    expect(screen.getByText('Yes')).toBeTruthy();
    expect(screen.getByText('No')).toBeTruthy();
  });

  it('should_render_confirm_and_cancel_buttons', () => {
    render(<ConfirmDialog open title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Confirmar')).toBeTruthy();
    expect(screen.getByText('Cancelar')).toBeTruthy();
  });
});
