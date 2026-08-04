'use client';

import { RefObject } from 'react';
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
  endRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ messages, loading, hasUserMessage, onSelectSuggestion, endRef }: Props) {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
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

      <div ref={endRef} />
    </Box>
  );
}
