// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/chat/icons', () => ({
  BotIcon: () => <span data-testid="bot-icon">BotIcon</span>,
}));

import { ChatTypingIndicator } from '@/components/chat/chat-typing-indicator';

describe('ChatTypingIndicator', () => {
  it('should_render_with_status_role', () => {
    render(<ChatTypingIndicator />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('should_have_aria_live_polite', () => {
    render(<ChatTypingIndicator />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('should_render_typing_indicator_text', () => {
    render(<ChatTypingIndicator />);
    expect(screen.getByText('Assistente está digitando...')).toBeTruthy();
  });

  it('should_render_bot_icon', () => {
    render(<ChatTypingIndicator />);
    expect(screen.getByTestId('bot-icon')).toBeTruthy();
  });
});
