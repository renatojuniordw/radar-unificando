'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { ChatSuggestions } from './chat-suggestions';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatTypingIndicator } from './chat-typing-indicator';

interface Message {
  id?: string;
  role: string;
  parts?: { type: string; text?: string }[];
}

interface Props {
  messages: Message[];
  loading: boolean;
  hasUserMessage: boolean;
  onSelectSuggestion: (suggestion: string) => void;
}

export function ChatMessageList({ messages, loading, hasUserMessage, onSelectSuggestion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        px: 2,
        py: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        bgcolor: 'grey.50',
      }}
    >
      {!hasUserMessage && <ChatSuggestions onSelect={onSelectSuggestion} />}

      {messages.map((msg, index) => (
        <ChatMessageBubble key={`${msg.id}-${index}`} message={msg} />
      ))}

      {loading && <ChatTypingIndicator />}
    </Box>
  );
}
