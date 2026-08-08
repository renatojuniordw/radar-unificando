'use client';

import { Box, Typography, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

interface Props {
  hasJobs: boolean;
  countTotalFilters: number;
  onClearFilters: () => void;
}

export function JobEmptyState({ hasJobs, countTotalFilters, onClearFilters }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2, color: '#94a3b8' }}>
      <SearchOffIcon sx={{ fontSize: 52, mb: 1.5, color: '#ccff00', opacity: 0.8 }} />
      <Typography sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#f8fafc' }}>
        Nenhuma vaga encontrada
      </Typography>
      <Typography sx={{ mb: 2.5, maxWidth: 460, mx: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#94a3b8' }}>
        {!hasJobs
          ? 'Preencha os parâmetros e clique em BUSCAR VAGAS para iniciar.'
          : 'Tente limpar os filtros ou buscar por outro termo.'}
      </Typography>
      {countTotalFilters > 0 && (
        <Button
          onClick={onClearFilters}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 0,
            border: '2px solid #ccff00',
            color: '#ccff00',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            boxShadow: '3px 3px 0px #ccff00',
            '&:hover': {
              bgcolor: '#ccff00',
              color: '#020617',
              borderColor: '#ccff00',
            },
          }}
        >
          REMOVER TODOS OS FILTROS
        </Button>
      )}
    </Box>
  );
}

