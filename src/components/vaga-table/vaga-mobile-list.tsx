'use client';

import { type RefObject } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { VagaMobileCard } from './vaga-mobile-card';
import type { Vaga } from '@/lib/types/vaga';

const ITENS_POR_PAGINA = 10;

interface Props {
  vagas: Vaga[];
  containerRef: RefObject<HTMLDivElement | null>;
  pagina: number;
  onPaginaChange: (pagina: number) => void;
}

export function VagaMobileList({ vagas, containerRef, pagina, onPaginaChange }: Props) {
  const totalPaginas = Math.ceil(vagas.length / ITENS_POR_PAGINA);

  function irParaPagina(novaPagina: number) {
    onPaginaChange(novaPagina);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Box ref={containerRef} sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
      {vagas
        .slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)
        .map((vaga, index) => (
          <VagaMobileCard key={vaga.id || `${vaga.empresa}-${vaga.titulo_vaga}-${index}`} vaga={vaga} />
        ))}

      {/* Mobile Pagination Navigation Bar */}
      {totalPaginas > 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            pt: 1,
            pb: 1,
            gap: 1,
            borderTop: '2px dashed #cbd5e1',
            mt: 1,
          }}
        >
          <Button
            disabled={pagina === 1}
            onClick={() => irParaPagina(Math.max(pagina - 1, 1))}
            size="small"
            sx={{
              border: '2px solid #020617',
              bgcolor: pagina === 1 ? '#e2e8f0' : '#ffffff',
              color: '#020617',
              fontWeight: 900,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              borderRadius: 0,
              boxShadow: pagina === 1 ? 'none' : '2px 2px 0px #000',
              px: 1.5,
              py: 0.75,
              opacity: pagina === 1 ? 0.5 : 1,
            }}
          >
            ← ANTERIOR
          </Button>

          <Typography
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.75rem',
              fontWeight: 900,
              color: '#020617',
            }}
          >
            PÁG {pagina} / {totalPaginas}
          </Typography>

          <Button
            disabled={pagina >= totalPaginas}
            onClick={() => irParaPagina(Math.min(pagina + 1, totalPaginas))}
            size="small"
            sx={{
              border: '2px solid #020617',
              bgcolor: pagina >= totalPaginas ? '#e2e8f0' : '#020617',
              color: pagina >= totalPaginas ? '#94a3b8' : '#ccff00',
              fontWeight: 900,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              borderRadius: 0,
              boxShadow: pagina >= totalPaginas ? 'none' : '2px 2px 0px #000',
              px: 1.5,
              py: 0.75,
              opacity: pagina >= totalPaginas ? 0.5 : 1,
            }}
          >
            PRÓXIMA →
          </Button>
        </Box>
      )}
    </Box>
  );
}
