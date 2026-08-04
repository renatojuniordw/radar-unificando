'use client';

import { Box, Typography } from '@mui/material';
import { getMessageText } from '@/lib/chat';
import { BotIcon, UserIcon } from './icons';
import { MarkdownContent } from './markdown-content';
import { CopyMessageButton } from './copy-message-button';

interface Props {
  message: { role: string; parts?: { type: string; text?: string }[] };
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const text = getMessageText(message);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 1,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: isUser ? 'primary.main' : 'grey.200',
          color: isUser ? 'common.white' : 'text.secondary',
        }}
      >
        {isUser ? <UserIcon /> : <BotIcon />}
      </Box>

      <Box
        sx={{
          maxWidth: '88%',
          px: 2,
          py: 1.5,
          borderRadius: 1.5,
          bgcolor: isUser ? 'primary.main' : 'common.white',
          color: isUser ? 'common.white' : 'text.primary',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        {isUser ? (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {text}
          </Typography>
        ) : (
          <>
            <MarkdownContent text={text} />
            <CopyMessageButton text={text} />
          </>
        )}
      </Box>
    </Box>
  );
}
