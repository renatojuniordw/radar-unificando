// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

const mockUseSession = vi.fn();
const { dynamicMock } = vi.hoisted(() => ({ dynamicMock: vi.fn() }));

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('next/dynamic', () => ({
  // Registra a factory lazy e as options (ssr: false) e retorna um componente
  // mockado no lugar do ChatAssistantUI carregado sob demanda.
  default: (factory: () => unknown, options?: Record<string, unknown>) => {
    dynamicMock(factory, options);
    const MockChat = () => <div data-testid="chat-assistant-ui">Chat UI</div>;
    return MockChat;
  },
}));

vi.mock('@/components/chat/chat-ui', () => ({
  ChatAssistantUI: () => <div data-testid="real-chat-ui">Real Chat UI</div>,
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

  it('should_render_chat_ui_when_authenticated', () => {
    mockUseSession.mockReturnValue({ data: { user: { name: 'Ana' } }, status: 'authenticated' });
    render(<ChatAssistantMount />);
    expect(screen.getByTestId('chat-assistant-ui')).toBeTruthy();
    expect(screen.getByText('Chat UI')).toBeTruthy();
  });

  it('should_mount_chat_ui_via_lazy_dynamic_with_ssr_false', () => {
    // dynamic() é invocado no topo do módulo com factory lazy + ssr:false,
    // garantindo que o bundle pesado do chat não é baixado no SSR.
    expect(dynamicMock).toHaveBeenCalledTimes(1);
    const [factory, options] = dynamicMock.mock.calls[0];
    expect(typeof factory).toBe('function');
    expect(options).toEqual({ ssr: false });
  });

  it('should_lazy_factory_resolve_to_chat_ui_component', async () => {
    // A factory registrada no dynamic() deve resolver (quando invocada pelo
    // Next) para o componente ChatAssistantUI do módulo lazy.
    const [factory] = dynamicMock.mock.calls[0] as [
      () => Promise<() => ReactElement>,
    ];
    const mod = await factory();
    expect(typeof mod).toBe('function');
  });
});