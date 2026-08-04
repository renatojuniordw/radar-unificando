'use client';

import { Box, Typography, Tooltip } from '@mui/material';
import { formatVagaDate } from '@/lib/date';
import { trackJobApply } from '@/lib/analytics';
import type { Vaga } from '@/lib/types/vaga';

interface Props {
  vaga: Vaga;
}

export function VagaMobileCard({ vaga }: Props) {
  const dateInfo = formatVagaDate(vaga.publicado, vaga.detectado_em);

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        border: '3px solid #020617',
        boxShadow: '4px 4px 0px #000',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      {/* Header: Company & Platform Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: '0.85rem',
            color: '#020617',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vaga.empresa}
        </Typography>

        <Box
          sx={{
            border: '2px solid #020617',
            bgcolor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#e2e8f0',
            color: '#020617',
            fontWeight: 900,
            fontSize: '0.6rem',
            px: 1,
            py: 0.25,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {vaga.plataforma}
        </Box>
      </Box>

      {/* Job Title */}
      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#020617', lineHeight: 1.25 }}>
        {vaga.titulo_vaga}
      </Typography>

      {/* Metadata Pills */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {dateInfo && (
          <Tooltip title={`${dateInfo.label} em ${dateInfo.full}`} arrow>
            <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
              📅 {dateInfo.label} {dateInfo.relative}
            </Box>
          </Tooltip>
        )}
        {vaga.tipo && (
          <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
            {vaga.tipo}
          </Box>
        )}
        {vaga.local && (
          <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
            📍 {vaga.local}
          </Box>
        )}
      </Box>

      {/* Action CTA Button */}
      <a
        href={vaga.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackJobApply({ titulo: vaga.titulo_vaga, empresa: vaga.empresa, plataforma: vaga.plataforma, link: vaga.link })}
        style={{ textDecoration: 'none', marginTop: 4 }}
      >
        <Box
          sx={{
            width: '100%',
            textAlign: 'center',
            bgcolor: '#020617',
            color: '#ccff00',
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, monospace',
            border: '2px solid #020617',
            boxShadow: '3px 3px 0px #000',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#1e293b',
            },
          }}
        >
          VER VAGA NO {vaga.plataforma.toUpperCase()} →
        </Box>
      </a>
    </Box>
  );
}
