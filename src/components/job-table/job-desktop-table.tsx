'use client';

import { useRef } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatJobDate } from '@/lib/utils/date';
import { trackJobApply } from '@/lib/utils/analytics';
import type { Job } from '@/lib/types/job';

const GRID_COLUMNS = '180px 120px 140px 1fr 150px 90px';

interface Props {
  jobs: Job[];
}

export function JobDesktopTable({ jobs }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual retorna funções que não podem ser memoizadas com segurança
  // (API incompatível com o React Compiler). Desabilitado por linha.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
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
            const job = jobs[virtualRow.index];
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
                  <Tooltip title={job.company} arrow>
                    <span style={{ fontWeight: 800, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.company}
                    </span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', minWidth: 0 }}>
                  <span style={{
                    border: '2px solid #020617',
                    backgroundColor: job.platform === 'Gupy' ? '#ccff00' : '#e2e8f0',
                    color: '#020617',
                    fontWeight: 900,
                    fontSize: '0.55rem',
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'inline-block',
                  }}>
                    {job.platform}
                  </span>
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
                  {(() => {
                    const dateInfo = formatJobDate(job.postedAt, job.detectedAt);
                    if (!dateInfo) return '';
                    return (
                      <Tooltip title={`${dateInfo.label} em ${dateInfo.full}`} arrow>
                        <span>{dateInfo.label} {dateInfo.relative}</span>
                      </Tooltip>
                    );
                  })()}
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={job.title} arrow>
                    <span>{job.title}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={job.location} arrow>
                    <span>{job.location}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px' }}>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackJobApply({ title: job.title, company: job.company, platform: job.platform, link: job.link })}
                    aria-label={`Ver vaga ${job.title} na ${job.company}`}
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
