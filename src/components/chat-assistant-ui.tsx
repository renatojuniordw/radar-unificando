'use client';

import { useState, useEffect } from 'react';
import { Box, Fab, Drawer } from '@mui/material';
import { useSession } from 'next-auth/react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useChatAssistant } from '@/contexts/chat-assistant-context';
import { useChatConversation } from '@/hooks/useChatConversation';
import { getMessageText, CHAT_THREAD_MESSAGE_LIMIT } from '@/lib/chat';
import { trackAiChat } from '@/lib/analytics';
import { ChatIcon } from '@/components/chat-assistant/icons';
import { ChatHeader } from '@/components/chat-assistant/chat-header';
import { ChatMessageList } from '@/components/chat-assistant/chat-message-list';
import { ChatQuickActions } from '@/components/chat-assistant/chat-quick-actions';
import { ChatInput } from '@/components/chat-assistant/chat-input';
import { ChatSuggestedReplies } from '@/components/chat-assistant/chat-suggested-replies';
import { SyncErrorBanner, ThreadLimitBanner, DailyLimitBanner } from '@/components/chat-assistant/chat-limit-banner';

export function ChatAssistantUI() {
  const { data: session, status } = useSession();
  const { open, openDrawer, close: closeDrawer, pendingPrompt, clearPendingPrompt } = useChatAssistant();

  const [input, setInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    chatId,
    messages,
    sendMessage,
    loading,
    syncError,
    conversations,
    dailyUsage,
    reload,
    selectConversation,
    startNewConversation,
    clearHistory,
  } = useChatConversation({ userName: session?.user?.name, active: open });

  useEffect(() => {
    if (open && pendingPrompt) {
      sendMessage({ text: pendingPrompt });
      clearPendingPrompt();
    }
  }, [open, pendingPrompt, sendMessage, clearPendingPrompt]);

  // Enquanto carrega, não renderiza nada
  if (status === 'loading') return null;

  // Sem sessão → não renderiza FAB nem drawer
  if (!session) return null;

  // Detecção dos limites de conversa (25 mensagens) e limite diário (50 mensagens)
  const lastMessageText = messages.length > 0 ? getMessageText(messages[messages.length - 1]) : '';
  const isDailyLimitReached = dailyUsage.isDailyLimitReached || lastMessageText.includes('Limite diário de interações atingido');
  const isThreadLimitReached = !isDailyLimitReached && (
    messages.length >= CHAT_THREAD_MESSAGE_LIMIT || lastMessageText.includes('limite de 25 mensagens')
  );
  const inputDisabled = loading || isThreadLimitReached || isDailyLimitReached;
  const hasUserMessage = messages.some((m) => m.role === 'user');

  function handleSend() {
    if (!input.trim() || inputDisabled) return;
    trackAiChat('send_message');
    sendMessage({ text: input });
    setInput('');
  }

  function handleSelectConversation(id: string) {
    if (!selectConversation(id)) {
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(false);
  }

  function handleNewConversation() {
    if (isDailyLimitReached) return;
    startNewConversation();
    setSidebarOpen(false);
  }

  async function handleClearHistory() {
    setConfirmOpen(false);
    await clearHistory();
  }

  const inputPlaceholder = isDailyLimitReached
    ? 'Limite diário atingido...'
    : isThreadLimitReached
    ? 'Limite desta conversa atingido. Inicie um novo chat.'
    : 'Digite sua mensagem...';

  return (
    <>
      <Fab
        color="primary"
        onClick={openDrawer}
        aria-label="Abrir assistente de vagas"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          display: open ? 'none' : 'flex',
          width: 56,
          height: 56,
          boxShadow: '0 4px 14px 0 rgba(2, 6, 23, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(2, 6, 23, 0.45)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 200ms ease-out',
        }}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: sidebarOpen ? 650 : 400 },
              maxWidth: '100vw',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <ChatHeader
          loading={loading}
          messageCount={messages.length}
          dailyCount={dailyUsage.count}
          dailyLimit={dailyUsage.limit}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewChat={() => setConfirmOpen(true)}
          isDailyLimitReached={isDailyLimitReached}
          onClose={closeDrawer}
        />

        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {sidebarOpen && (
            <ChatSidebar
              conversations={conversations}
              activeId={chatId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
            />
          )}

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {syncError && <SyncErrorBanner />}

            <ChatMessageList
              messages={messages}
              loading={loading}
              hasUserMessage={hasUserMessage}
              onSelectSuggestion={setInput}
              onRetry={reload}
            />

            {!hasUserMessage && !isThreadLimitReached && !isDailyLimitReached && (
              <ChatQuickActions loading={loading} onSelect={(prompt) => sendMessage({ text: prompt })} />
            )}

            {isThreadLimitReached && (
              <ThreadLimitBanner onNewConversation={handleNewConversation} isDailyLimitReached={isDailyLimitReached} />
            )}

            {isDailyLimitReached && <DailyLimitBanner />}

            {hasUserMessage && !isThreadLimitReached && !isDailyLimitReached && (
              <ChatSuggestedReplies
                lastMessageText={lastMessageText}
                loading={loading}
                onSelect={(prompt) => sendMessage({ text: prompt })}
              />
            )}

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={inputDisabled}
              placeholder={inputPlaceholder}
            />
          </Box>
        </Box>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        title="Nova Conversa"
        message="Deseja iniciar uma nova conversa? O histórico atual será limpo."
        confirmLabel="Nova Conversa"
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
