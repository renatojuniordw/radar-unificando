'use client';

import { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface Props {
  value: string[];
  onChange: (cargos: string[]) => void;
}

export function CargoInput({ value, onChange }: Props) {
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Cargos que você quer buscar (opcional). Deixe vazio para usar os termos padrão.
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
        Digite o cargo e pressione <b>Enter</b> ou <b>vírgula</b> para adicionar.{' '}
        Ex: <b>Analista de Dados, Data Analyst, Growth</b>
      </Typography>
      <Box
        sx={{
          display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1.5,
          border: 1, borderColor: 'divider', borderRadius: 1,
          minHeight: 56, alignItems: 'center', mb: 2, bgcolor: 'background.paper',
        }}
      >
        {value.map(cargo => (
          <Chip
            key={cargo} label={cargo} onDelete={() => remove(cargo)}
            size="small" variant="outlined" color="primary"
            sx={{ fontWeight: 700, fontSize: 11 }}
          />
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) { add(input); setInput(''); } }}
          placeholder={value.length === 0 ? 'Analista de Dados, Data Analyst, Growth...' : ''}
          style={{
            border: 'none', outline: 'none', flex: 1, minWidth: 120,
            fontFamily: 'inherit', fontSize: '0.875rem', padding: '4px 0',
            background: 'transparent',
          }}
        />
      </Box>
    </Box>
  );
}
