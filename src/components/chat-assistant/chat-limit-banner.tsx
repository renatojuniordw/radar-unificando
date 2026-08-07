'use client';

import { Box, IconButton, Typography } from '@mui/material';

export function SyncErrorBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        px: 2,
        py: 0.75,
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        fontSize: '0.75rem',
        textAlign: 'center',
      }}
    >
      Não foi possível sincronizar o histórico com o servidor. Suas mensagens estão sendo salvas apenas neste dispositivo.
    </Box>
  );
}

export function ThreadLimitBanner({ onNewConversation, isDailyLimitReached }: { onNewConversation: () => void; isDailyLimitReached: boolean }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        p: 2,
        bgcolor: 'grey.100',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        Esta conversa atingiu o limite de 25 mensagens. Inicie um novo chat para continuar!
      </Typography>
      <IconButton
        onClick={onNewConversation}
        disabled={isDailyLimitReached}
        sx={{
          bgcolor: 'primary.main',
          color: 'common.white',
          px: 3,
          py: 1,
          borderRadius: 2,
          fontSize: '0.875rem',
          fontWeight: 700,
          width: 'auto',
          height: 'auto',
          gap: 1,
          boxShadow: '0 4px 12px rgba(2,6,23,0.2)',
          '&:hover': {
            bgcolor: 'primary.dark',
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': {
            bgcolor: 'grey.300',
            color: 'grey.500',
          },
        }}
      >
        + Iniciar Novo Chat
      </IconButton>
    </Box>
  );
}

export function DailyLimitBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        p: 2,
        bgcolor: 'error.50',
        borderTop: '1px solid',
        borderColor: 'error.light',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.dark' }}>
        Limite diário de interações atingido (50 mensagens/dia). O limite será renovado à meia-noite.
      </Typography>
    </Box>
  );
}

export function TokenLimitBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        p: 2,
        bgcolor: 'error.50',
        borderTop: '1px solid',
        borderColor: 'error.light',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.dark' }}>
        Limite diário de consumo de IA atingido. Os limites renovam à meia-noite (diário) e no dia 1º do mês (mensal).{' '}
        <a href="/termos" style={{ color: 'inherit' }}>
          Saiba mais
        </a>
      </Typography>
    </Box>
  );
}

export function GlobalBudgetWarningBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        px: 2,
        py: 0.75,
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        fontSize: '0.75rem',
        textAlign: 'center',
      }}
    >
      O orçamento diário do projeto está quase no limite. As respostas podem ficar mais curtas até a meia-noite.
    </Box>
  );
}

export function GlobalBudgetExhaustedBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        p: 2,
        bgcolor: 'error.50',
        borderTop: '1px solid',
        borderColor: 'error.light',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.dark' }}>
        O orçamento diário do projeto foi atingido. O chat volta a funcionar após a meia-noite.
      </Typography>
    </Box>
  );
}
