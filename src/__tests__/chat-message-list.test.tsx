// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/chat/chat-suggestions', () => ({
  ChatSuggestions: () => <div>SUGGESTIONS</div>,
}));
vi.mock('@/components/chat/chat-message-bubble', () => ({
  ChatMessageBubble: ({ message }: any) => <div>BUBBLE:{message.role}</div>,
}));
vi.mock('@/components/chat/chat-typing-indicator', () => ({
  ChatTypingIndicator: () => <div>TYPING</div>,
}));

import { ChatMessageList } from '@/components/chat/chat-message-list';

const MESSAGES = [
  { id: '1', role: 'user', parts: [{ type: 'text', text: 'olá' }] },
  { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'oi!' }] },
];

describe('ChatMessageList', () => {
  function renderList(overrides: Partial<Parameters<typeof ChatMessageList>[0]> = {}) {
    return render(
      <ChatMessageList
        messages={MESSAGES}
        loading={false}
        hasUserMessage
        onSelectSuggestion={vi.fn()}
        {...overrides}
      />,
    );
  }

  it('should_render_message_bubbles', () => {
    renderList();
    expect(screen.getByText('BUBBLE:user')).toBeTruthy();
    expect(screen.getByText('BUBBLE:assistant')).toBeTruthy();
  });

  it('should_show_suggestions_when_no_user_message', () => {
    renderList({ hasUserMessage: false, messages: [] });
    expect(screen.getByText('SUGGESTIONS')).toBeTruthy();
  });

  it('should_show_typing_indicator_while_loading', () => {
    renderList({ loading: true });
    expect(screen.getByText('TYPING')).toBeTruthy();
  });

  function stubScrollGeometry(scrollBox: HTMLElement) {
    Object.defineProperty(scrollBox, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(scrollBox, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollBox, 'clientHeight', { value: 100, configurable: true });
  }

  it('should_show_scroll_to_bottom_chip_when_not_at_bottom', () => {
    const { container } = renderList();
    const scrollBox = container.querySelectorAll('[class*="MuiBox"]')[1] as HTMLElement;
    stubScrollGeometry(scrollBox);
    fireEvent.scroll(scrollBox);
    expect(screen.getByText('Ir para a mensagem recente')).toBeTruthy();
  });
});