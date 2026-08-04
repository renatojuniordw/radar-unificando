'use client';

import { Box, Typography, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

interface Props {
  hasVagas: boolean;
  countTotalFilters: number;
  onClearFilters: () => void;
}

export function VagaEmptyState({ hasVagas, countTotalFilters, onClearFilters }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2, color: '#64748b' }}>
      <SearchOffIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
      <Typography sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#020617' }}>
        Nenhuma vaga encontrada
      </Typography>
      <Typography sx={{ mb: 2, maxWidth: 420, mx: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b' }}>
        {!hasVagas
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
            border: '2px solid #020617',
            color: '#020617',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            boxShadow: '2px 2px 0px #000',
          }}
        >
          REMOVER TODOS OS FILTROS
        </Button>
      )}
    </Box>
  );
}
