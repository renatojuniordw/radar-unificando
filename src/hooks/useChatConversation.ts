'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import {
  type Conversation,
  createWelcomeMessage,
  generateChatId,
  loadMessagesFromServer,
  saveMessagesToServer,
} from '@/lib/utils/chat';
import { browserStorage } from '@/lib/infrastructure/storage/browser-storage';

export interface GlobalBudgetUsage {
  usedUsd: number;
  limitUsd: number;
  ratio: number;
  degraded: boolean;
  exhausted: boolean;
}

export interface DailyUsage {
  count: number;
  limit: number;
  remaining: number;
  isDailyLimitReached: boolean;
  dailyTokens: number;
  dailyTokenLimit: number;
  dailyTokenRemaining: number;
  monthlyTokens: number;
  monthlyTokenLimit: number;
  monthlyTokenRemaining: number;
  isTokenLimitReached: boolean;
  contextTokens?: number;
  globalBudget?: GlobalBudgetUsage;
}

interface UseChatConversationParams {
  userName?: string | null;
  active: boolean;
}

export function useChatConversation({ userName, active }: UseChatConversationParams) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({
    count: 0,
    limit: 50,
    remaining: 50,
    isDailyLimitReached: false,
    dailyTokens: 0,
    dailyTokenLimit: 100000,
    dailyTokenRemaining: 100000,
    monthlyTokens: 0,
    monthlyTokenLimit: 2000000,
    monthlyTokenRemaining: 2000000,
    isTokenLimitReached: false,
    contextTokens: 0,
    globalBudget: { usedUsd: 0, limitUsd: 0.95, ratio: 0, degraded: false, exhausted: false },
  });

  // Throttle mais alto reduz a frequência de re-render em respostas com
  // muitas tool-result parts chegando em rajada (ex: várias análises de
  // vaga no mesmo turno), mitigando risco de "Maximum update depth exceeded".
  const { messages, sendMessage, status: chatStatus, setMessages, regenerate } = useChat({
    throttle: 250,
  });

  const loading = chatStatus === 'submitted' || chatStatus === 'streaming';
  const prevLoadingRef = useRef(false);

  // Trigger haptic feedback quando a resposta da IA terminar
  useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignorar se a API de vibração não estiver disponível
        }
      }
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  const fetchDailyUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/usage');
      if (res.ok) {
        const data = await res.json();
        setDailyUsage(data);
      }
    } catch {
      // Ignorar erros de rede em background
    }
  }, []);

  const fetchContextTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/context');
      if (res.ok) {
        const data = await res.json();
        setDailyUsage((prev) => ({ ...prev, contextTokens: data.contextTokens ?? 0 }));
      }
    } catch {
      // Ignorar erros de rede em background
    }
  }, []);

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
    if (!active) return;
    let isMounted = true;

    const loadInitialData = async () => {
      await loadConversations();
      if (isMounted) {
        await fetchDailyUsage();
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [active, fetchDailyUsage]);

  useEffect(() => {
    if (loading) return;
    let isMounted = true;

    const syncUsage = async () => {
      if (isMounted) {
        await fetchDailyUsage();
        await fetchContextTokens();
      }
    };

    void syncUsage();

    return () => {
      isMounted = false;
    };
  }, [loading, fetchDailyUsage, fetchContextTokens]);

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
    dailyUsage,
    refreshDailyUsage: fetchDailyUsage,
    reload: regenerate,
    selectConversation,
    startNewConversation,
    clearHistory,
  };
}
