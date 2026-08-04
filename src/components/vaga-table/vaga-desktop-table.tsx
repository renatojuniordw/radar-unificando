'use client';

import { useRef } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatVagaDate } from '@/lib/date';
import { trackJobApply } from '@/lib/analytics';
import type { Vaga } from '@/lib/types/vaga';

const GRID_COLUMNS = '180px 120px 140px 1fr 150px 90px';

interface Props {
  vagas: Vaga[];
}

export function VagaDesktopTable({ vagas }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: vagas.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 8,
  });

  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, border: '4px solid #020617', overflowX: 'auto' }}>
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          backgroundColor: '#020617',
          minWidth: 800,
        }}
      >
        {['EMPRESA', 'PLATAFORMA', 'DATA', 'TÍTULO DA VAGA', 'LOCALIDADE', 'AÇÃO'].map(h => (
          <div key={h} role="columnheader" style={{ color: '#ccff00', fontWeight: 900, padding: '10px 12px', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
            {h}
          </div>
        ))}
      </div>

      <div ref={parentRef} style={{ height: '60vh', overflowY: 'auto', minWidth: 800 }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const vaga = vagas[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                role="row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: GRID_COLUMNS,
                  alignItems: 'center',
                  backgroundColor: virtualRow.index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <Tooltip title={vaga.empresa} arrow>
                    <span style={{ fontWeight: 800, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vaga.empresa}
                    </span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', minWidth: 0 }}>
                  <span style={{
                    border: '2px solid #020617',
                    backgroundColor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#e2e8f0',
                    color: '#020617',
                    fontWeight: 900,
                    fontSize: '0.55rem',
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'inline-block',
                  }}>
                    {vaga.plataforma}
                  </span>
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
                  {(() => {
                    const dateInfo = formatVagaDate(vaga.publicado, vaga.detectado_em);
                    if (!dateInfo) return '';
                    return (
                      <Tooltip title={`${dateInfo.label} em ${dateInfo.full}`} arrow>
                        <span>{dateInfo.label} {dateInfo.relative}</span>
                      </Tooltip>
                    );
                  })()}
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={vaga.titulo_vaga} arrow>
                    <span>{vaga.titulo_vaga}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={vaga.local} arrow>
                    <span>{vaga.local}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px' }}>
                  <a
                    href={vaga.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackJobApply({ titulo: vaga.titulo_vaga, empresa: vaga.empresa, plataforma: vaga.plataforma, link: vaga.link })}
                    aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
                    style={{
                      backgroundColor: '#020617',
                      color: '#ccff00',
                      fontWeight: 900,
                      fontSize: '0.6rem',
                      padding: '5px 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textDecoration: 'none',
                      border: '2px solid #020617',
                      fontFamily: 'ui-monospace, monospace',
                      boxShadow: '2px 2px 0px #000',
                      display: 'inline-block',
                    }}
                  >
                    VER VAGA
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Box>
  );
}
