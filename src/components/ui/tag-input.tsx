'use client';

import { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface Props {
  label: string;
  helperText?: string;
  placeholder: string;
  value: string[];
  onChange: (tags: string[]) => void;
  autoFocus?: boolean;
  dark?: boolean;
  compact?: boolean;
}

export function TagInput({ label, helperText, placeholder, value, onChange, autoFocus, dark, compact }: Props) {
  const [input, setInput] = useState('');

  function addBatch(text: string) {
    const parts = text
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !value.includes(s));

    if (parts.length > 0) {
      onChange([...value, ...parts]);
    }
  }

  function remove(v: string) {
    onChange(value.filter(e => e !== v));
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

  return (
    <Box>
      {!compact && (
        <>
          <Typography variant="body2" sx={{ mb: 0.5, color: dark ? '#94a3b8' : 'text.secondary', fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" sx={{ display: 'block', mb: 2, color: dark ? '#64748b' : 'text.disabled', fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {helperText}
            </Typography>
          )}
        </>
      )}
      <Box
        sx={{
          display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1.5,
          border: '4px solid', borderColor: dark ? '#334155' : '#020617',
          borderRadius: 0,
          boxShadow: dark ? 'none' : '4px 4px 0px #000',
          minHeight: 56, alignItems: 'center', mb: compact ? 0 : 2,
          bgcolor: dark ? '#0f172a' : 'background.paper',
        }}
      >
        {value.map(tag => (
          <Chip
            key={tag} label={tag} onDelete={() => remove(tag)}
            size="small" variant="outlined" color="warning"
            sx={{ fontWeight: 700, fontSize: 11 }}
          />
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (input.trim()) { addBatch(input); setInput(''); } }}
          placeholder={value.length === 0 ? placeholder : ''}
          autoFocus={autoFocus}
          aria-label={label}
          style={{
            border: 'none', outline: 'none', flex: 1, minWidth: 120,
            fontFamily: 'inherit', fontSize: '1rem', padding: '4px 0',
            background: 'transparent', color: dark ? '#e2e8f0' : 'inherit',
          }}
        />
      </Box>
    </Box>
  );
}
