'use client';

import { Box, Chip } from '@mui/material';

const QUICK_ACTIONS = [
  { label: 'Buscar vagas', prompt: 'Busque vagas alinhadas ao meu perfil' },
  { label: 'Analisar perfil', prompt: 'Analise meu perfil e me diga como estão minhas chances' },
  { label: 'Gerar carta', prompt: 'Gere uma carta de apresentação para uma vaga' },
];

interface Props {
  loading: boolean;
  onSelect: (prompt: string) => void;
}

export function ChatQuickActions({ loading, onSelect }: Props) {
  return (
    <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {QUICK_ACTIONS.map((action) => (
        <Chip
          key={action.label}
          label={action.label}
          size="small"
          disabled={loading}
          onClick={() => onSelect(action.prompt)}
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', color: 'common.white' } }}
        />
      ))}
    </Box>
  );
}
