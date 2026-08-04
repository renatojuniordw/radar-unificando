'use client';

import { Box, IconButton, TextareaAutosize } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Bloquear envio por Enter se os limites forem atingidos ou estiver enviando
      if (!e.shiftKey && !disabled && value.trim()) {
        onSend();
      }
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'common.white',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          p: 0.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: disabled ? 'grey.300' : 'divider',
          bgcolor: disabled ? 'grey.100' : 'grey.50',
          '&:focus-within': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            boxShadow: disabled ? 'none' : '0 0 0 2px rgba(2, 6, 23, 0.12)',
          },
          transition: 'all 150ms ease-out',
        }}
      >
        <TextareaAutosize
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Mensagem"
          minRows={1}
          maxRows={6}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: 'none',
            background: 'transparent',
            fontSize: '0.875rem',
            outline: 'none',
            color: 'inherit',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={!canSend}
          aria-label="Enviar mensagem"
          sx={{
            width: 44,
            height: 44,
            bgcolor: canSend ? 'primary.main' : 'grey.300',
            color: 'common.white',
            '&:hover': {
              bgcolor: canSend ? 'primary.dark' : 'grey.400',
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.200',
              color: 'grey.400',
            },
            transition: 'all 150ms ease-out',
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
