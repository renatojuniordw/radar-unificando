'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ChatAssistantState {
  open: boolean;
  pendingPrompt: string | null;
}

interface ChatAssistantContextType extends ChatAssistantState {
  openDrawer: () => void;
  openWithPrompt: (prompt: string) => void;
  close: () => void;
  clearPendingPrompt: () => void;
}

const ChatAssistantContext = createContext<ChatAssistantContextType | null>(null);

export function ChatAssistantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatAssistantState>({
    open: false,
    pendingPrompt: null,
  });

  const openDrawer = useCallback(() => {
    setState(prev => ({ ...prev, open: true }));
  }, []);

  const openWithPrompt = useCallback((prompt: string) => {
    setState({ open: true, pendingPrompt: prompt });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const clearPendingPrompt = useCallback(() => {
    setState(prev => ({ ...prev, pendingPrompt: null }));
  }, []);

  return (
    <ChatAssistantContext.Provider value={{ ...state, openDrawer, openWithPrompt, close, clearPendingPrompt }}>
      {children}
    </ChatAssistantContext.Provider>
  );
}

export function useChatAssistant() {
  const context = useContext(ChatAssistantContext);
  if (!context) {
    throw new Error('useChatAssistant must be used within ChatAssistantProvider');
  }
  return context;
}
