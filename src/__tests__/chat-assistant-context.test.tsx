// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatAssistantProvider, useChatAssistant } from '@/contexts/chat-assistant-context';

function Consumer() {
  const { open, pendingPrompt, openDrawer, openWithPrompt, close, clearPendingPrompt } = useChatAssistant();
  return (
    <div>
      <span data-testid="open">{String(open)}</span>
      <span data-testid="prompt">{pendingPrompt ?? 'null'}</span>
      <button onClick={openDrawer}>open</button>
      <button onClick={() => openWithPrompt('olá')}>with prompt</button>
      <button onClick={close}>close</button>
      <button onClick={clearPendingPrompt}>clear</button>
    </div>
  );
}

describe('ChatAssistantProvider', () => {
  it('should_start_closed_without_prompt', () => {
    render(
      <ChatAssistantProvider>
        <Consumer />
      </ChatAssistantProvider>,
    );
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(screen.getByTestId('prompt').textContent).toBe('null');
  });

  it('should_open_drawer', () => {
    render(
      <ChatAssistantProvider>
        <Consumer />
      </ChatAssistantProvider>,
    );
    fireEvent.click(screen.getByText('open'));
    expect(screen.getByTestId('open').textContent).toBe('true');
  });

  it('should_open_with_pending_prompt', () => {
    render(
      <ChatAssistantProvider>
        <Consumer />
      </ChatAssistantProvider>,
    );
    fireEvent.click(screen.getByText('with prompt'));
    expect(screen.getByTestId('open').textContent).toBe('true');
    expect(screen.getByTestId('prompt').textContent).toBe('olá');
  });

  it('should_close_drawer', () => {
    render(
      <ChatAssistantProvider>
        <Consumer />
      </ChatAssistantProvider>,
    );
    fireEvent.click(screen.getByText('with prompt'));
    fireEvent.click(screen.getByText('close'));
    expect(screen.getByTestId('open').textContent).toBe('false');
    // close não limpa o prompt pendente
    expect(screen.getByTestId('prompt').textContent).toBe('olá');
  });

  it('should_clear_pending_prompt', () => {
    render(
      <ChatAssistantProvider>
        <Consumer />
      </ChatAssistantProvider>,
    );
    fireEvent.click(screen.getByText('with prompt'));
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('prompt').textContent).toBe('null');
  });

  it('should_throw_when_used_outside_provider', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useChatAssistant must be used within ChatAssistantProvider',
    );
  });
});