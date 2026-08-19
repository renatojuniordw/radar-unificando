// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
const { useChatAssistantMock } = vi.hoisted(() => ({ useChatAssistantMock: vi.fn() }));
const { useChatConversationMock } = vi.hoisted(() => ({ useChatConversationMock: vi.fn() }));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));
vi.mock('@/contexts/chat-assistant-context', () => ({ useChatAssistant: useChatAssistantMock }));
vi.mock('@/hooks/useChatConversation', () => ({ useChatConversation: useChatConversationMock }));
vi.mock('@/lib/utils/analytics', () => ({ trackAiChat: vi.fn() }));
vi.mock('@/components/chat/icons', () => ({ ChatIcon: () => <span>ICON</span> }));
vi.mock('@/components/chat/chat-header', () => ({
  ChatHeader: ({ onClose, onNewChat, onToggleSidebar }: any) => (
    <div>
      <button onClick={onClose}>fechar</button>
      <button onClick={onNewChat}>nova conversa</button>
      <button onClick={onToggleSidebar}>toggle sidebar</button>
    </div>
  ),
}));
vi.mock('@/components/chat/chat-sidebar', () => ({
  ChatSidebar: ({ onSelect, onNew }: any) => (
    <div>
      <button onClick={() => onSelect('conv-1')}>conv-1</button>
      <button onClick={onNew}>novo chat</button>
    </div>
  ),
}));
vi.mock('@/components/chat/chat-message-list', () => ({
  ChatMessageList: () => <div>LISTA</div>,
}));
vi.mock('@/components/chat/chat-quick-actions', () => ({
  ChatQuickActions: () => <div>QUICK</div>,
}));
vi.mock('@/components/chat/chat-suggested-replies', () => ({
  ChatSuggestedReplies: () => <div>SUGGESTED</div>,
}));
vi.mock('@/components/chat/chat-input', () => ({
  ChatInput: ({ value, onChange, onSend, disabled, placeholder }: any) => (
    <div>
      <input
        aria-label="Mensagem"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <button onClick={onSend} disabled={disabled}>enviar</button>
    </div>
  ),
}));
vi.mock('@/components/chat/chat-limit-banner', () => ({
  SyncErrorBanner: () => <div>SYNC ERROR</div>,
  ThreadLimitBanner: () => <div>THREAD LIMIT</div>,
  DailyLimitBanner: () => <div>DAILY LIMIT</div>,
  TokenLimitBanner: () => <div>TOKEN LIMIT</div>,
  GlobalBudgetWarningBanner: () => <div>BUDGET WARNING</div>,
  GlobalBudgetExhaustedBanner: () => <div>BUDGET EXHAUSTED</div>,
}));
vi.mock('@/components/ui/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel }: any) =>
    open ? (
      <div>
        <button onClick={onConfirm}>confirmar</button>
        <button onClick={onCancel}>cancelar</button>
      </div>
    ) : null,
}));

import { ChatAssistantUI } from '@/components/chat/chat-ui';

function baseConversation(overrides: Record<string, unknown> = {}) {
  return {
    chatId: 'chat-1',
    messages: [],
    sendMessage: vi.fn(),
    loading: false,
    syncError: null,
    conversations: [],
    dailyUsage: { count: 0, limit: 50, isDailyLimitReached: false, isTokenLimitReached: false, dailyTokens: 0, dailyTokenLimit: 99000, monthlyTokens: 0, monthlyTokenLimit: 1000000, contextTokens: 0, globalBudget: null },
    reload: vi.fn(),
    selectConversation: vi.fn(() => true),
    startNewConversation: vi.fn(),
    clearHistory: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderChat(overrides: Record<string, unknown> = {}) {
  useSessionMock.mockReturnValue({ data: { user: { name: 'Ana' } }, status: 'authenticated' });
  useChatAssistantMock.mockReturnValue({
    open: true,
    openDrawer: vi.fn(),
    close: vi.fn(),
    pendingPrompt: null,
    clearPendingPrompt: vi.fn(),
  });
  useChatConversationMock.mockReturnValue(baseConversation(overrides));
  return render(<ChatAssistantUI />);
}

describe('ChatAssistantUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: { user: { name: 'Ana' } }, status: 'authenticated' });
    useChatAssistantMock.mockReturnValue({
      open: true,
      openDrawer: vi.fn(),
      close: vi.fn(),
      pendingPrompt: null,
      clearPendingPrompt: vi.fn(),
    });
    useChatConversationMock.mockReturnValue(baseConversation());
  });

  it('should_render_nothing_while_session_loading', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' });
    const { container } = render(<ChatAssistantUI />);
    expect(container.innerHTML).toBe('');
  });

  it('should_render_nothing_without_session', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { container } = render(<ChatAssistantUI />);
    expect(container.innerHTML).toBe('');
  });

  it('should_render_drawer_and_input_when_open', () => {
    renderChat();
    expect(screen.getByLabelText('Mensagem')).toBeTruthy();
    expect(screen.getByText('LISTA')).toBeTruthy();
  });

  it('should_send_message_and_clear_input', () => {
    renderChat();
    const input = screen.getByLabelText('Mensagem');
    fireEvent.change(input, { target: { value: 'olá' } });
    fireEvent.click(screen.getByText('enviar'));
    const conv = useChatConversationMock();
    expect(conv.sendMessage).toHaveBeenCalledWith({ text: 'olá' });
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('should_auto_send_pending_prompt', () => {
    useChatAssistantMock.mockReturnValue({
      open: true,
      openDrawer: vi.fn(),
      close: vi.fn(),
      pendingPrompt: 'me ajude',
      clearPendingPrompt: vi.fn(),
    });
    useChatConversationMock.mockReturnValue(baseConversation());
    render(<ChatAssistantUI />);
    const conv = useChatConversationMock();
    expect(conv.sendMessage).toHaveBeenCalledWith({ text: 'me ajude' });
  });

  it('should_show_thread_limit_banner_and_disable_input', () => {
    renderChat({ messages: Array.from({ length: 25 }, (_, i) => ({ id: `${i}`, role: 'user', content: 'x' })) });
    expect(screen.getByText('THREAD LIMIT')).toBeTruthy();
    expect((screen.getByLabelText('Mensagem') as HTMLInputElement).disabled).toBe(true);
  });

  it('should_show_daily_limit_banner', () => {
    renderChat({ dailyUsage: { count: 50, limit: 50, isDailyLimitReached: true, isTokenLimitReached: false, dailyTokens: 0, dailyTokenLimit: 99000, monthlyTokens: 0, monthlyTokenLimit: 1000000, contextTokens: 0, globalBudget: null } });
    expect(screen.getByText('DAILY LIMIT')).toBeTruthy();
  });

  it('should_show_token_limit_banner', () => {
    renderChat({ dailyUsage: { count: 0, limit: 50, isDailyLimitReached: false, isTokenLimitReached: true, dailyTokens: 100000, dailyTokenLimit: 99000, monthlyTokens: 0, monthlyTokenLimit: 1000000, contextTokens: 0, globalBudget: null } });
    expect(screen.getByText('TOKEN LIMIT')).toBeTruthy();
  });

  it('should_show_budget_exhausted_banner', () => {
    renderChat({ dailyUsage: { count: 0, limit: 50, isDailyLimitReached: false, isTokenLimitReached: false, dailyTokens: 0, dailyTokenLimit: 99000, monthlyTokens: 0, monthlyTokenLimit: 1000000, contextTokens: 0, globalBudget: { exhausted: true, degraded: false } } });
    expect(screen.getByText('BUDGET EXHAUSTED')).toBeTruthy();
  });

  it('should_show_budget_degraded_warning', () => {
    renderChat({ dailyUsage: { count: 0, limit: 50, isDailyLimitReached: false, isTokenLimitReached: false, dailyTokens: 0, dailyTokenLimit: 99000, monthlyTokens: 0, monthlyTokenLimit: 1000000, contextTokens: 0, globalBudget: { exhausted: false, degraded: true } } });
    expect(screen.getByText('BUDGET WARNING')).toBeTruthy();
  });

  it('should_clear_history_after_confirmation', () => {
    renderChat();
    fireEvent.click(screen.getByText('nova conversa'));
    fireEvent.click(screen.getByText('confirmar'));
    const conv = useChatConversationMock();
    expect(conv.clearHistory).toHaveBeenCalled();
  });

  it('should_start_new_conversation_from_sidebar', () => {
    renderChat();
    fireEvent.click(screen.getByText('toggle sidebar'));
    fireEvent.click(screen.getByText('novo chat'));
    const conv = useChatConversationMock();
    expect(conv.startNewConversation).toHaveBeenCalled();
  });
});