'use client';

import { Box, Typography } from '@mui/material';
import { BotIcon } from './icons';

export function ChatTypingIndicator() {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }} role="status" aria-live="polite">
      <Typography sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Assistente está digitando...
      </Typography>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.200',
          color: 'text.secondary',
        }}
      >
        <BotIcon />
      </Box>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 1,
          bgcolor: 'common.white',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'grey.400',
                animation: 'pulse 1.4s infinite ease-in-out',
                animationDelay: `${i * 0.2}s`,
                '@keyframes pulse': {
                  '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                  '40%': { opacity: 1, transform: 'scale(1)' },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
