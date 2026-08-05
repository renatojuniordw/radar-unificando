'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Chip, Badge } from '@mui/material';
import { ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';
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
  onRetry?: () => void;
}

export function ChatMessageList({ messages, loading, hasUserMessage, onSelectSuggestion, onRetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [baselineCount, setBaselineCount] = useState(messages.length);
  const unreadCount = isAtBottom ? 0 : Math.max(0, messages.length - baselineCount);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setIsAtBottom(true);
      setBaselineCount(messages.length);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const bottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsAtBottom(bottom);
    if (bottom) {
      setBaselineCount(messages.length);
    }
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, loading, isAtBottom, scrollToBottom]);

  return (
    <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          px: 2,
          py: 2.5,
          pb: isAtBottom ? 2.5 : 7,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          bgcolor: 'grey.50',
        }}
      >
        {!hasUserMessage && <ChatSuggestions onSelect={onSelectSuggestion} />}

        {messages.map((msg, index) => (
          <ChatMessageBubble
            key={`${msg.id}-${index}`}
            message={msg}
            isLast={index === messages.length - 1}
            onRetry={onRetry}
          />
        ))}

        {loading && <ChatTypingIndicator />}
      </Box>

      {!isAtBottom && (
        <>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              zIndex: 9,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(250,250,250,0), rgba(250,250,250,1) 70%)',
            }}
          />
          <Badge
            badgeContent={unreadCount}
            color="error"
            invisible={unreadCount === 0}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <Chip
              icon={<ArrowDownwardIcon sx={{ fontSize: '1rem !important' }} />}
              label="Ir para a mensagem recente"
              onClick={scrollToBottom}
              color="primary"
              size="small"
              sx={{
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 1.5,
                px: 1,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            />
          </Badge>
        </>
      )}
    </Box>
  );
}
