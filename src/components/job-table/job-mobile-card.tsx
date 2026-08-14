'use client';

import { Box, Typography, Tooltip } from '@mui/material';
import { formatJobDate } from '@/lib/utils/date';
import { trackJobApply } from '@/lib/utils/analytics';
import type { Job } from '@/lib/types/job';

interface Props {
  job: Job;
  canGenerateResume: boolean;
  onGenerateResume: (job: Job) => void;
  generatingJobKey: string | null;
  onAnalyzeAts: (job: Job) => void;
}

export function JobMobileCard({ job, canGenerateResume, onGenerateResume, generatingJobKey, onAnalyzeAts }: Props) {
  const dateInfo = formatJobDate(job.postedAt, job.detectedAt);

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
          {job.company}
        </Typography>

        <Box
          sx={{
            border: '2px solid #020617',
            bgcolor: job.platform === 'Gupy' ? '#ccff00' : '#e2e8f0',
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
          {job.platform}
        </Box>
      </Box>

      {/* Job Title */}
      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#020617', lineHeight: 1.25 }}>
        {job.title}
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
        {job.type && (
          <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
            {job.type}
          </Box>
        )}
        {job.location && (
          <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
            📍 {job.location}
          </Box>
        )}
      </Box>

      {/* Action CTA Button */}
      <a
        href={job.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackJobApply({ title: job.title, company: job.company, platform: job.platform, link: job.link })}
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
          VER VAGA NO {job.platform.toUpperCase()} →
        </Box>
      </a>

      {canGenerateResume && (
        <Box
          onClick={() => onAnalyzeAts(job)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAnalyzeAts(job);
            }
          }}
          sx={{
            width: '100%',
            textAlign: 'center',
            bgcolor: '#ffffff',
            color: '#020617',
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, monospace',
            border: '2px solid #020617',
            boxShadow: '3px 3px 0px #000',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#e2e8f0',
            },
          }}
        >
          ANALISAR ATS
        </Box>
      )}

      {canGenerateResume && (
        <Box
          onClick={() => onGenerateResume(job)}
          role="button"
          tabIndex={0}
          aria-disabled={generatingJobKey === `${job.company}|${job.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onGenerateResume(job);
            }
          }}
          sx={{
            width: '100%',
            textAlign: 'center',
            bgcolor: generatingJobKey === `${job.company}|${job.title}` ? '#94a3b8' : '#ccff00',
            color: '#020617',
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, monospace',
            border: '2px solid #020617',
            boxShadow: '3px 3px 0px #000',
            cursor: generatingJobKey === `${job.company}|${job.title}` ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: generatingJobKey === `${job.company}|${job.title}` ? '#94a3b8' : '#b8e600',
            },
          }}
        >
          {generatingJobKey === `${job.company}|${job.title}`
            ? 'GERANDO CURRÍCULO...'
            : 'GERAR CURRÍCULO ADAPTADO'}
        </Box>
      )}
    </Box>
  );
}
