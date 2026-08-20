// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/utils/chat', () => ({
  getMessageText: (msg: { parts?: { type: string; text?: string }[] }) =>
    (msg.parts || [])
      .filter((p: any) => p.type === 'text' && p.text)
      .map((p: any) => p.text || '')
      .join(' '),
}));

vi.mock('@/components/chat/icons', () => ({
  BotIcon: () => <span data-testid="bot-icon">BotIcon</span>,
  UserIcon: () => <span data-testid="user-icon">UserIcon</span>,
}));

vi.mock('@/components/chat/markdown-content', () => ({
  MarkdownContent: ({ text }: { text: string }) => <div data-testid="markdown-content">{text}</div>,
}));

vi.mock('@/components/chat/copy-message-button', () => ({
  CopyMessageButton: () => <button data-testid="copy-button">Copiar</button>,
}));

import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';

describe('ChatMessageBubble', () => {
  it('should_render_user_message', () => {
    const message = {
      role: 'user',
      parts: [{ type: 'text', text: 'Hello, I need help' }],
    };
    render(<ChatMessageBubble message={message} />);
    expect(screen.getByText('Hello, I need help')).toBeTruthy();
    expect(screen.getByTestId('user-icon')).toBeTruthy();
  });

  it('should_render_bot_message', () => {
    const message = {
      role: 'assistant',
      parts: [{ type: 'text', text: 'I can help you with that' }],
    };
    render(<ChatMessageBubble message={message} />);
    expect(screen.getByTestId('markdown-content')).toBeTruthy();
    expect(screen.getByTestId('bot-icon')).toBeTruthy();
  });

  it('should_render_error_message_with_retry_button', () => {
    const onRetry = vi.fn();
    const message = {
      role: 'assistant',
      parts: [{ type: 'text', text: 'Ocorreu um erro ao processar sua solicitação' }],
    };
    render(<ChatMessageBubble message={message} isLast={true} onRetry={onRetry} />);
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });

  it('should_call_on_retry_when_button_clicked', () => {
    const onRetry = vi.fn();
    const message = {
      role: 'assistant',
      parts: [{ type: 'text', text: 'Erro ao processar dados' }],
    };
    render(<ChatMessageBubble message={message} isLast={true} onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should_not_show_retry_button_when_not_last_message', () => {
    const onRetry = vi.fn();
    const message = {
      role: 'assistant',
      parts: [{ type: 'text', text: 'Ocorreu um erro' }],
    };
    render(<ChatMessageBubble message={message} isLast={false} onRetry={onRetry} />);
    expect(screen.queryByText('Tentar novamente')).toBeNull();
  });

  it('should_not_show_retry_button_when_not_error_message', () => {
    const onRetry = vi.fn();
    const message = {
      role: 'assistant',
      parts: [{ type: 'text', text: 'Tudo certo com sua solicitação' }],
    };
    render(<ChatMessageBubble message={message} isLast={true} onRetry={onRetry} />);
    expect(screen.queryByText('Tentar novamente')).toBeNull();
  });

  it('should_render_with_empty_parts', () => {
    const message = {
      role: 'user',
      parts: [],
    };
    render(<ChatMessageBubble message={message} />);
    expect(screen.getByTestId('user-icon')).toBeTruthy();
  });
});
