'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

// Carregado sob demanda: só monta o chat (react-markdown, @ai-sdk/react, MUI Drawer/Fab)
// quando há sessão, evitando baixar o bundle pesado em páginas anônimas.
const ChatAssistantUI = dynamic(
  () => import('@/components/chat/chat-ui').then((m) => m.ChatAssistantUI),
  { ssr: false }
);

export function ChatAssistantMount() {
  const { data: session, status } = useSession();
  if (status === 'loading' || !session) return null;
  return <ChatAssistantUI />;
}