'use client';

import { Box, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface Props {
  totalVagas: number;
  totalFiltradas: number;
  exporting: boolean;
  onExport: () => void;
}

export function VagaTableHeader({ totalVagas, totalFiltradas, exporting, onExport }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
      <Box>
        <Typography
          sx={{
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
            color: '#020617',
          }}
        >
          {totalFiltradas} VAGAS ENCONTRADAS
        </Typography>
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.65rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mt: 0.25,
          }}
        >
          Atualizado em tempo real · {totalVagas} vagas no banco
        </Typography>
      </Box>

      {totalVagas > 0 && (
        <button
          onClick={onExport}
          disabled={exporting}
          style={{
            border: '2px solid #020617',
            backgroundColor: '#ffffff',
            color: '#020617',
            fontWeight: 900,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: 'ui-monospace, monospace',
            boxShadow: '2px 2px 0px #000',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <DownloadIcon style={{ fontSize: 14 }} />
          {exporting ? 'EXPORTANDO...' : 'EXPORTAR CSV'}
        </button>
      )}
    </Box>
  );
}
