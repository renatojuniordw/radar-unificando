'use client';

import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getMessageText } from '@/lib/utils/chat';
import { BotIcon, UserIcon } from './icons';
import { MarkdownContent } from './markdown-content';
import { CopyMessageButton } from './copy-message-button';

interface Props {
  message: { role: string; parts?: { type: string; text?: string }[] };
  isLast?: boolean;
  onRetry?: () => void;
}

export function ChatMessageBubble({ message, isLast, onRetry }: Props) {
  const isUser = message.role === 'user';
  const text = getMessageText(message);
  const isErrorMessage = text.includes('Ocorreu um erro') || text.includes('Erro ao processar');

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
          bgcolor: isUser ? 'primary.main' : isErrorMessage ? 'error.light' : 'grey.200',
          color: isUser ? 'common.white' : isErrorMessage ? 'error.contrastText' : 'text.secondary',
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
          bgcolor: isUser ? 'primary.main' : isErrorMessage ? 'error.50' : 'common.white',
          color: isUser ? 'common.white' : isErrorMessage ? 'error.dark' : 'text.primary',
          border: isUser ? 'none' : '1px solid',
          borderColor: isErrorMessage ? 'error.light' : 'divider',
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CopyMessageButton text={text} />
              {isErrorMessage && onRetry && isLast && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon fontSize="small" />}
                  onClick={onRetry}
                  sx={{
                    fontSize: '0.7rem',
                    py: 0.2,
                    px: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Tentar novamente
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
