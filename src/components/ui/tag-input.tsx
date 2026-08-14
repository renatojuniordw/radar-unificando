'use client';

import { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface Props {
  label?: string;
  helperText?: string;
  placeholder: string;
  value: string[];
  onChange: (tags: string[]) => void;
  autoFocus?: boolean;
  dark?: boolean;
  compact?: boolean;
  showHelperHint?: boolean;
  frameless?: boolean;
}

export function TagInput({
  label,
  helperText = 'Separe múltiplos termos com vírgula (,) ou Enter',
  placeholder,
  value,
  onChange,
  autoFocus,
  dark = true,
  compact = false,
  showHelperHint = true,
  frameless = false,
}: Props) {
  const [input, setInput] = useState('');

  function addBatch(text: string) {
    const parts = text
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !value.includes(s));

    if (parts.length > 0) {
      onChange([...value, ...parts]);
    }
  }

  function remove(v: string) {
    onChange(value.filter((e) => e !== v));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
      e.preventDefault();
      addBatch(input);
      setInput('');
    }
    if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    addBatch(pastedText);
    setInput('');
  }

  // Feedback dinâmico enquanto o usuário digita
  const getDynamicHint = () => {
    if (input.trim().length > 0) {
      return `Pressione vírgula (,) ou Enter para adicionar "${input.trim()}"`;
    }
    if (value.length > 0) {
      return `${value.length} termo(s) em chips. Digite mais e separe com vírgula (,) ou Enter`;
    }
    return helperText;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography
            variant="body2"
            sx={{
              color: dark ? '#f8fafc' : '#020617',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 800,
              fontSize: compact ? '0.75rem' : '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          p: frameless ? '4px 0' : (compact ? 1.25 : 1.75),
          border: frameless ? 'none' : '3px solid',
          borderColor: frameless ? 'transparent' : (dark ? '#ccff00' : '#020617'),
          borderRadius: 0,
          boxShadow: frameless ? 'none' : (dark ? '4px 4px 0px #000' : '4px 4px 0px #020617'),
          minHeight: compact ? 44 : 52,
          alignItems: 'center',
          bgcolor: frameless ? 'transparent' : (dark ? '#0f172a' : '#ffffff'),
          transition: 'all 0.15s ease-in-out',
          '&:focus-within': frameless
            ? undefined
            : {
                borderColor: dark ? '#ffffff' : '#000000',
                boxShadow: dark ? '4px 4px 0px #ccff00' : '4px 4px 0px #ccff00',
              },
        }}
      >
        {value.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => remove(tag)}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              bgcolor: dark ? '#ccff00' : '#020617',
              color: dark ? '#020617' : '#ffffff',
              borderRadius: 0,
              border: '1px solid #000',
              '& .MuiChip-deleteIcon': {
                color: dark ? '#020617' : '#ffffff',
                '&:hover': {
                  color: '#ef4444',
                },
              },
            }}
          />
        ))}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (input.trim()) {
              addBatch(input);
              setInput('');
            }
          }}
          placeholder={value.length === 0 ? placeholder : 'Adicionar outro termo (+ vírgula ou Enter)...'}
          autoFocus={autoFocus}
          aria-label={label || 'Busca com chips'}
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: 160,
            fontFamily: 'inherit',
            fontSize: compact ? '0.9rem' : '1rem',
            padding: '4px 0',
            background: 'transparent',
            color: dark ? '#f8fafc' : '#020617',
          }}
        />
      </Box>

      {/* Dica visível de feedback ao usuário */}
      {showHelperHint && (
        <Typography
          variant="caption"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.75,
            color: input.trim().length > 0 ? (dark ? '#ccff00' : '#020617') : (dark ? '#94a3b8' : '#64748b'),
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            fontWeight: input.trim().length > 0 ? 800 : 700,
            letterSpacing: '0.02em',
            transition: 'color 0.15s ease',
          }}
        >
          <span>💡</span>
          <span>{getDynamicHint()}</span>
        </Typography>
      )}
    </Box>
  );
}


