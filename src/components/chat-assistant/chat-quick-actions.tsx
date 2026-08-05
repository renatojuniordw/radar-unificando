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
          variant="outlined"
          color="primary"
          disabled={loading}
          onClick={() => onSelect(action.prompt)}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 1.5,
            px: 0.5,
            bgcolor: 'grey.50',
            borderColor: 'primary.light',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'common.white',
              borderColor: 'primary.main',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': {
              opacity: 1,
              color: 'text.disabled',
              bgcolor: 'grey.100',
              borderColor: 'grey.300',
            },
          }}
        />
      ))}
    </Box>
  );
}
