'use client';

import { useState, useCallback } from 'react';
import type { DailyUsage } from '@/hooks/chat-types';

const INITIAL_USAGE: DailyUsage = {
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
};

/**
 * Hook isolado para tracking de uso diário e tokens de contexto do chat.
 */
export function useChatUsage() {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(INITIAL_USAGE);

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

  return {
    dailyUsage,
    fetchDailyUsage,
    fetchContextTokens,
  };
}
