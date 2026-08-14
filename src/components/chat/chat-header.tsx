'use client';

import type { ReactNode } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  ChatBubbleOutline as ContextIcon,
  CalendarMonthOutlined as CalendarIcon,
} from '@mui/icons-material';
import { BotIcon, HistoryIcon, PlusIcon } from './icons';

interface Props {
  loading: boolean;
  messageCount: number;
  dailyCount?: number;
  dailyLimit?: number;
  contextTokens?: number;
  contextTokenLimit?: number;
  dailyTokens?: number;
  dailyTokenLimit?: number;
  monthlyTokens?: number;
  monthlyTokenLimit?: number;
  isTokenLimitReached?: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isDailyLimitReached: boolean;
  onClose: () => void;
}

type Tone = 'normal' | 'warning' | 'error';

function toneColor(tone: Tone): string {
  switch (tone) {
    case 'warning':
      return 'warning.main';
    case 'error':
      return 'error.main';
    default:
      return 'text.secondary';
  }
}

function formatTokens(n: number): string {
  const fmt = (v: number) => {
    const s = v.toFixed(1).replace('.', ',');
    return s.endsWith(',0') ? s.slice(0, -2) : s;
  };
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}M`;
  if (n >= 1000) return `${fmt(n / 1000)}k`;
  return String(n);
}

function UsageItem({
  icon,
  label,
  value,
  tone,
  title,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: Tone;
  title?: string;
}) {
  return (
    <Tooltip title={title} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: toneColor(tone),
          cursor: title ? 'help' : 'default',
        }}
      >
        {icon}
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap' }}>
          {label} {value}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export function ChatHeader({
  loading,
  dailyCount = 0,
  dailyLimit = 50,
  contextTokens = 0,
  contextTokenLimit = 16000,
  dailyTokens = 0,
  dailyTokenLimit = 100000,
  monthlyTokens = 0,
  monthlyTokenLimit = 2000000,
  isTokenLimitReached = false,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  isDailyLimitReached,
  onClose,
}: Props) {
  const contextTone: Tone = contextTokens >= contextTokenLimit * 0.8 ? 'warning' : 'normal';
  const dailyTone: Tone = isTokenLimitReached ? 'error' : dailyTokens >= dailyTokenLimit * 0.8 ? 'warning' : 'normal';
  const monthlyTone: Tone = monthlyTokens >= monthlyTokenLimit * 0.8 ? 'warning' : 'normal';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1, sm: 1.25 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Linha superior: Identidade + Ações */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          width: '100%',
        }}
      >
        {/* Identidade */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
          <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Assistente de Vagas
            </Typography>
            {loading ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                Digitando...
              </Typography>
            ) : (
              <Box
                aria-label="Online"
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }}
              />
            )}
          </Box>
        </Box>

        {/* Barra de ações */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            flexShrink: 0,
          }}
        >
          <IconButton
            onClick={onToggleSidebar}
            aria-label="Histórico de conversas"
            sx={{
              width: 36,
              height: 36,
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
              width: 36,
              height: 36,
              color: isDailyLimitReached ? 'grey.400' : 'primary.main',
              '&:hover': {
                bgcolor: isDailyLimitReached ? 'transparent' : 'primary.light',
                color: isDailyLimitReached ? 'grey.400' : 'common.white',
              },
            }}
          >
            <PlusIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            aria-label="Fechar chat"
            sx={{
              width: 36,
              height: 36,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Linha inferior: cotas de uso */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          flexWrap: 'wrap',
          pt: 0.5,
          borderTop: '1px solid',
          borderColor: (theme) => alpha(theme.palette.divider, 0.4),
        }}
      >
        <UsageItem
          icon={<ContextIcon sx={{ fontSize: 13 }} />}
          label="Contexto"
          value={`${formatTokens(contextTokens)}/${formatTokens(contextTokenLimit)}`}
          tone={contextTone}
          title="Tokens enviados à IA nesta conversa (histórico completo). Dica: inicie um novo chat quando o indicador ficar alto."
        />
        <UsageItem
          icon={<CalendarIcon sx={{ fontSize: 13 }} />}
          label="Hoje"
          value={`${formatTokens(dailyTokens)}/${formatTokens(dailyTokenLimit)}`}
          tone={dailyTone}
          title={`Tokens de IA consumidos hoje (renovam à meia-noite). Interações: ${dailyCount}/${dailyLimit}.`}
        />
        <UsageItem
          icon={<CalendarIcon sx={{ fontSize: 13 }} />}
          label="Mês"
          value={`${formatTokens(monthlyTokens)}/${formatTokens(monthlyTokenLimit)}`}
          tone={monthlyTone}
          title="Tokens de IA consumidos no mês (renovam no dia 1º)."
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
            bgcolor: alpha('#00ff66', 0.08),
            px: 0.75,
            py: 0.2,
            borderRadius: 0.5,
            border: '1px solid',
            borderColor: alpha('#00ff66', 0.2),
            ml: 'auto',
            display: { xs: 'none', sm: 'inline-flex' },
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          🔒 LGPD Sanitizado
        </Typography>
      </Box>
    </Box>
  );
}