'use client';

import { Box, IconButton, Typography, Chip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { CHAT_THREAD_MESSAGE_LIMIT } from '@/lib/chat';
import { BotIcon, HistoryIcon, PlusIcon } from './icons';

interface Props {
  loading: boolean;
  messageCount: number;
  dailyCount?: number;
  dailyLimit?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isDailyLimitReached: boolean;
  onClose: () => void;
}

export function ChatHeader({
  loading,
  messageCount,
  dailyCount = 0,
  dailyLimit = 50,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  isDailyLimitReached,
  onClose,
}: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'common.white',
          }}
        >
          <BotIcon />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
            Assistente de Vagas
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {loading ? 'Digitando...' : 'Online'}
            </Typography>
            <Chip
              label={`${messageCount}/${CHAT_THREAD_MESSAGE_LIMIT} chat`}
              size="small"
              title="Mensagens nesta conversa"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 700,
                bgcolor: messageCount >= 20 ? 'warning.light' : 'grey.200',
                color: messageCount >= 20 ? 'warning.contrastText' : 'text.secondary',
                fontFamily: 'ui-monospace, monospace',
              }}
            />
            <Chip
              label={`${dailyCount}/${dailyLimit} hoje`}
              size="small"
              title="Mensagens enviadas hoje em todas as conversas"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 700,
                bgcolor: isDailyLimitReached
                  ? 'error.light'
                  : dailyCount >= 40
                  ? 'warning.light'
                  : 'grey.200',
                color: isDailyLimitReached
                  ? 'error.contrastText'
                  : dailyCount >= 40
                  ? 'warning.contrastText'
                  : 'text.secondary',
                fontFamily: 'ui-monospace, monospace',
              }}
            />
            <Typography
              component="a"
              href="/termos"
              target="_blank"
              variant="caption"
              sx={{
                color: 'success.main',
                fontSize: '0.65rem',
                fontWeight: 600,
                textDecoration: 'none',
                bgcolor: 'rgba(0, 255, 102, 0.08)',
                px: 0.75,
                py: 0.2,
                borderRadius: 0.5,
                border: '1px solid rgba(0, 255, 102, 0.2)',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              🔒 LGPD Sanitizado
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          onClick={onToggleSidebar}
          aria-label="Histórico de conversas"
          sx={{
            width: 44,
            height: 44,
            color: sidebarOpen ? 'primary.main' : 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <HistoryIcon />
        </IconButton>
        <IconButton
          onClick={onNewChat}
          disabled={isDailyLimitReached}
          aria-label="Nova conversa"
          title={isDailyLimitReached ? 'Limite diário de interações atingido' : 'Nova conversa'}
          sx={{
            width: 44,
            height: 44,
            color: isDailyLimitReached ? 'grey.400' : 'primary.main',
            '&:hover': { bgcolor: isDailyLimitReached ? 'transparent' : 'primary.light', color: isDailyLimitReached ? 'grey.400' : 'common.white' },
          }}
        >
          <PlusIcon />
        </IconButton>
        <IconButton
          onClick={onClose}
          aria-label="Fechar chat"
          sx={{
            width: 44,
            height: 44,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
