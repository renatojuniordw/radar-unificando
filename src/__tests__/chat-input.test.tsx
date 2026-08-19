// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '@/components/chat/chat-input';

const onSend = vi.fn();

beforeEach(() => {
  onSend.mockReset();
});

function renderChatInput(overrides: Partial<Parameters<typeof ChatInput>[0]> = {}) {
  return render(
    <ChatInput
      value=""
      onChange={vi.fn()}
      onSend={onSend}
      disabled={false}
      placeholder="Digite sua mensagem"
      {...overrides}
    />,
  );
}

describe('ChatInput', () => {
  it('should_send_on_enter_with_text', () => {
    renderChatInput({ value: 'olá' });
    fireEvent.keyDown(screen.getByLabelText('Mensagem'), { key: 'Enter' });
    expect(onSend).toHaveBeenCalled();
  });

  it('should_not_send_on_shift_enter', () => {
    renderChatInput({ value: 'olá' });
    fireEvent.keyDown(screen.getByLabelText('Mensagem'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('should_not_send_when_disabled', () => {
    renderChatInput({ value: 'olá', disabled: true });
    fireEvent.keyDown(screen.getByLabelText('Mensagem'), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('should_not_send_when_value_is_whitespace', () => {
    renderChatInput({ value: '   ' });
    fireEvent.keyDown(screen.getByLabelText('Mensagem'), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('should_disable_send_button_when_empty_or_disabled', () => {
    const { rerender } = renderChatInput({ value: '' });
    expect((screen.getByLabelText('Enviar mensagem') as HTMLButtonElement).disabled).toBe(true);
    rerender(
      <ChatInput value="texto" onChange={vi.fn()} onSend={onSend} disabled placeholder="x" />,
    );
    expect((screen.getByLabelText('Enviar mensagem') as HTMLButtonElement).disabled).toBe(true);
  });

  it('should_send_via_button_click', () => {
    renderChatInput({ value: 'mensagem' });
    fireEvent.click(screen.getByLabelText('Enviar mensagem'));
    expect(onSend).toHaveBeenCalled();
  });
});