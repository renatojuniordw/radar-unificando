'use client';

import { Box, IconButton, Typography, Chip, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
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
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Assistente de Vagas
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {loading ? 'Digitando...' : 'Online'}
            </Typography>
            <Tooltip title="Limite da janela de contexto para garantir respostas precisas nesta conversa." arrow>
              <Chip
                label={isMobile ? `${messageCount}/${CHAT_THREAD_MESSAGE_LIMIT}` : `${messageCount}/${CHAT_THREAD_MESSAGE_LIMIT} chat`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  bgcolor: messageCount >= 20 ? 'warning.light' : 'grey.200',
                  color: messageCount >= 20 ? 'warning.contrastText' : 'text.secondary',
                  fontFamily: 'ui-monospace, monospace',
                  cursor: 'help',
                }}
              />
            </Tooltip>
            <Tooltip title="Limite diário de interações por conta. Renova automaticamente à meia-noite (00:00)." arrow>
              <Chip
                label={isMobile ? `${dailyCount}/${dailyLimit}` : `${dailyCount}/${dailyLimit} hoje`}
                size="small"
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
                  cursor: 'help',
                }}
              />
            </Tooltip>
            {!isMobile && (
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
                  bgcolor: alpha('#00ff66', 0.08),
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 0.5,
                  border: '1px solid',
                  borderColor: alpha('#00ff66', 0.2),
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                🔒 LGPD Sanitizado
              </Typography>
            )}
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
