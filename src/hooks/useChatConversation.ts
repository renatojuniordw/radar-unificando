'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import {
  type Conversation,
  createWelcomeMessage,
  generateChatId,
  loadMessagesFromServer,
  saveMessagesToServer,
} from '@/lib/chat';
import { browserStorage } from '@/lib/infrastructure/storage/browser-storage';

interface UseChatConversationParams {
  userName?: string | null;
  active: boolean;
}

export function useChatConversation({ userName, active }: UseChatConversationParams) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status: chatStatus, setMessages } = useChat({
    throttle: 100,
  });

  const loading = chatStatus === 'submitted' || chatStatus === 'streaming';

  // Carrega ou cria o chat id persistido (IndexedDB)
  useEffect(() => {
    let cancelled = false;
    browserStorage.getChatId().then((id) => {
      if (cancelled) return;
      const next = id ?? generateChatId();
      setChatId(next);
      if (!id) void browserStorage.setChatId(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega as mensagens do chat ativo (servidor com fallback local)
  useEffect(() => {
    if (!chatId) return;
    const currentChatId = chatId;
    let cancelled = false;
    async function load() {
      const { messages: fromServer, error } = await loadMessagesFromServer(currentChatId);
      const stored = fromServer.length > 0 ? fromServer : await browserStorage.getChatMessages();
      if (cancelled) return;
      if (error) setSyncError(true);
      if (stored.length > 0 && setMessages) {
        setMessages(stored as UIMessage[]);
      } else if (setMessages) {
        setMessages([createWelcomeMessage(userName)]);
      }
      setIsLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, userName]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persiste as mensagens localmente e sincroniza com o servidor
  useEffect(() => {
    if (!chatId) return;
    const currentChatId = chatId;
    if (messages.length > 0 && isLoaded && !loading) {
      void browserStorage.setChatMessages(messages);
      const timeoutId = setTimeout(() => {
        saveMessagesToServer(currentChatId, messages).then((ok) => {
          setSyncError(!ok);
          if (ok) loadConversations();
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, chatId, isLoaded, loading]);

  async function loadConversations() {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        setConversations(await res.json());
      } else {
        setSyncError(true);
      }
    } catch {
      setSyncError(true);
    }
  }

  useEffect(() => {
    if (active) loadConversations();
  }, [active]);

  function selectConversation(id: string) {
    if (id === chatId) return false;
    setIsLoaded(false);
    setChatId(id);
    void browserStorage.setChatId(id);
    return true;
  }

  function startNewConversation() {
    const newId = generateChatId();
    void browserStorage.setChatId(newId);
    setChatId(newId);
    setMessages([createWelcomeMessage(userName)]);
    setIsLoaded(true);
  }

  async function clearHistory() {
    if (!chatId) return;
    setMessages([]);
    setSyncError(false);
    void browserStorage.setChatMessages([]);
    try {
      const res = await fetch(`/api/chat/history?chatId=${chatId}`, { method: 'DELETE' });
      if (!res.ok) setSyncError(true);
    } catch {
      setSyncError(true);
    }
  }

  return {
    chatId,
    messages,
    sendMessage,
    loading,
    syncError,
    conversations,
    endRef,
    selectConversation,
    startNewConversation,
    clearHistory,
  };
}
