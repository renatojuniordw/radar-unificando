'use client';

import { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface Props {
  value: string[];
  onChange: (companies: string[]) => void;
  autoFocus?: boolean;
  dark?: boolean;
  compact?: boolean;
}

export function CompanyInput({ value, onChange, autoFocus, dark, compact }: Props) {
  const [input, setInput] = useState('');

  function add(v: string) {
    const trimmed = v.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  }

  function remove(v: string) {
    onChange(value.filter(e => e !== v));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      input.split(',').map(s => s.trim()).filter(Boolean).forEach(add);
      setInput('');
    }
    if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <Box>
      {!compact && (
        <>
          <Typography variant="body2" sx={{ mb: 0.5, color: dark ? '#94a3b8' : 'text.secondary', fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Empresas (opcional)
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: dark ? '#64748b' : 'text.disabled', fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Enter ou vírgula para adicionar. Deixe vazio para buscar todas.
          </Typography>
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
        {value.map(emp => (
          <Chip
            key={emp} label={emp} onDelete={() => remove(emp)}
            size="small" variant="outlined" color="warning"
            sx={{ fontWeight: 700, fontSize: 11 }}
          />
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) { add(input); setInput(''); } }}
          placeholder={value.length === 0 ? 'Ambev, Nubank, BRQ...' : ''}
          autoFocus={autoFocus}
          style={{
            border: 'none', outline: 'none', flex: 1, minWidth: 120,
            fontFamily: 'inherit', fontSize: '0.875rem', padding: '4px 0',
            background: 'transparent', color: dark ? '#e2e8f0' : 'inherit',
          }}
        />
      </Box>
    </Box>
  );
}
