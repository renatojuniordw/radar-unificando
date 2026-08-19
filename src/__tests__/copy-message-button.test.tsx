// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CopyMessageButton } from '@/components/chat/copy-message-button';

describe('CopyMessageButton', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_copy_text_and_show_copied_state', async () => {
    writeText.mockResolvedValue(undefined);
    render(<CopyMessageButton text="conteúdo" />);
    fireEvent.click(screen.getByText('Copiar Texto'));
    expect(writeText).toHaveBeenCalledWith('conteúdo');
    expect(screen.getByText('Copiado!')).toBeTruthy();
  });

  it('should_revert_to_copy_label_after_two_seconds', () => {
    vi.useFakeTimers();
    writeText.mockResolvedValue(undefined);
    render(<CopyMessageButton text="conteúdo" />);
    fireEvent.click(screen.getByText('Copiar Texto'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Copiar Texto')).toBeTruthy();
  });

  it('should_not_copy_when_text_empty', () => {
    render(<CopyMessageButton text="" />);
    fireEvent.click(screen.getByText('Copiar Texto'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_tolerate_clipboard_failure', () => {
    writeText.mockRejectedValue(new Error('denied'));
    render(<CopyMessageButton text="conteúdo" />);
    expect(() => fireEvent.click(screen.getByText('Copiar Texto'))).not.toThrow();
  });
});