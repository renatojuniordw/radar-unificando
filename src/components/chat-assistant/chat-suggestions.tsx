'use client';

import { Box, Chip } from '@mui/material';
import { CHAT_SUGGESTIONS } from '@/lib/chat';

interface Props {
  onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: Props) {
  return (
    <Box sx={{ textAlign: 'center', mt: 1, mb: 2, px: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.75 }}>
        {CHAT_SUGGESTIONS.map((s) => (
          <Chip
            key={s}
            label={s}
            size="small"
            onClick={() => onSelect(s)}
            sx={{
              bgcolor: 'action.hover',
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.300' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
