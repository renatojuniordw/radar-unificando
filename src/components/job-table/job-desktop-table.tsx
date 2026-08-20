'use client';

import { useRef } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatJobDate } from '@/lib/utils/date';
import { trackJobApply } from '@/lib/utils/analytics';
import type { Job } from '@/lib/types/job';
import { tokens } from "@/lib/infrastructure/ui/tokens";

const GRID_COLUMNS = '180px 120px 140px 1fr 150px 180px';

interface Props {
  jobs: Job[];
  canGenerateResume: boolean;
  onGenerateResume: (job: Job) => void;
  generatingJobKey: string | null;
  onAnalyzeAts: (job: Job) => void;
}

export function JobDesktopTable({ jobs, canGenerateResume, onGenerateResume, generatingJobKey, onAnalyzeAts }: Props) {
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
          backgroundColor: tokens.primary,
          minWidth: 800,
        }}
      >
        {['EMPRESA', 'PLATAFORMA', 'DATA', 'TÍTULO DA VAGA', 'LOCALIDADE', 'AÇÃO'].map(h => (
          <div key={h} role="columnheader" style={{ color: tokens.accent, fontWeight: 900, padding: '10px 12px', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', fontFamily: tokens.fontMono }}>
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
                  backgroundColor: virtualRow.index % 2 === 0 ? tokens.surface : tokens.surfaceHover,
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <Tooltip title={job.company} arrow>
                    <span style={{ fontWeight: 800, color: tokens.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.company}
                    </span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', minWidth: 0 }}>
                  <span style={{
                    border: tokens.border,
                    backgroundColor: job.platform === 'Gupy' ? tokens.accent : '#e2e8f0',
                    color: tokens.primary,
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

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: tokens.fontMono }}>
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

                <div style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 700, color: tokens.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={job.title} arrow>
                    <span>{job.title}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: tokens.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={job.location} arrow>
                    <span>{job.location}</span>
                  </Tooltip>
                </div>

                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackJobApply({ title: job.title, company: job.company, platform: job.platform, link: job.link })}
                    aria-label={`Ver vaga ${job.title} na ${job.company}`}
                    style={{
                      backgroundColor: tokens.primary,
                      color: tokens.accent,
                      fontWeight: 900,
                      fontSize: '0.6rem',
                      padding: '5px 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textDecoration: 'none',
                      border: tokens.border,
                      fontFamily: tokens.fontMono,
                      boxShadow: '2px 2px 0px #000',
                      display: 'inline-block',
                      textAlign: 'center',
                    }}
                  >
                    VER VAGA
                  </a>
                  {canGenerateResume && (
                    <button
                      type="button"
                      onClick={() => onAnalyzeAts(job)}
                      aria-label={`Analisar ATS para ${job.title} na ${job.company}`}
                      style={{
                        backgroundColor: tokens.surface,
                        color: tokens.primary,
                        fontWeight: 900,
                        fontSize: '0.6rem',
                        padding: '5px 10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: tokens.border,
                        fontFamily: tokens.fontMono,
                        boxShadow: '2px 2px 0px #000',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ANALISAR ATS
                    </button>
                  )}
                  {canGenerateResume && (
                    <button
                      type="button"
                      onClick={() => onGenerateResume(job)}
                      disabled={generatingJobKey === `${job.company}|${job.title}`}
                      aria-label={`Gerar currículo adaptado para ${job.title} na ${job.company}`}
                      style={{
                        backgroundColor: generatingJobKey === `${job.company}|${job.title}` ? '#94a3b8' : tokens.accent,
                        color: tokens.primary,
                        fontWeight: 900,
                        fontSize: '0.6rem',
                        padding: '5px 10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: tokens.border,
                        fontFamily: tokens.fontMono,
                        boxShadow: '2px 2px 0px #000',
                        cursor: generatingJobKey === `${job.company}|${job.title}` ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {generatingJobKey === `${job.company}|${job.title}`
                        ? 'GERANDO...'
                        : 'GERAR CURRÍCULO'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Box>
  );
}
