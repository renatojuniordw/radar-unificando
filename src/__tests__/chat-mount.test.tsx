// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseSession = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    const MockChat = () => <div data-testid="chat-assistant-ui">Chat UI</div>;
    return MockChat;
  },
}));

import { ChatAssistantMount } from '@/components/chat/chat-mount';

describe('ChatAssistantMount', () => {
  it('should_render_null_when_session_is_loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    const { container } = render(<ChatAssistantMount />);
    expect(container.innerHTML).toBe('');
  });

  it('should_render_null_when_session_is_unauthenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { container } = render(<ChatAssistantMount />);
    expect(container.innerHTML).toBe('');
  });

  it('should_render_null_when_session_data_is_null', () => {
    mockUseSession.mockReturnValue({ data: undefined, status: 'unauthenticated' });
    const { container } = render(<ChatAssistantMount />);
    expect(container.innerHTML).toBe('');
  });
});
