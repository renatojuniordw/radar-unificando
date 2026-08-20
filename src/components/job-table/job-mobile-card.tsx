'use client';

import { Box, Typography, Tooltip } from '@mui/material';
import { formatJobDate } from '@/lib/utils/date';
import { trackJobApply } from '@/lib/utils/analytics';
import type { Job } from '@/lib/types/job';
import { tokens } from "@/lib/infrastructure/ui/tokens";

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
        bgcolor: tokens.surface,
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
            color: tokens.primary,
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
            border: tokens.border,
            bgcolor: job.platform === 'Gupy' ? tokens.accent : '#e2e8f0',
            color: tokens.primary,
            fontWeight: 900,
            fontSize: '0.6rem',
            px: 1,
            py: 0.25,
            fontFamily: tokens.fontMono,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {job.platform}
        </Box>
      </Box>

      {/* Job Title */}
      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: tokens.primary, lineHeight: 1.25 }}>
        {job.title}
      </Typography>

      {/* Metadata Pills */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {dateInfo && (
          <Tooltip title={`${dateInfo.label} em ${dateInfo.full}`} arrow>
            <Box sx={{ border: '1px solid #020617', bgcolor: tokens.surfaceHover, px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: tokens.fontMono, color: '#334155' }}>
              📅 {dateInfo.label} {dateInfo.relative}
            </Box>
          </Tooltip>
        )}
        {job.type && (
          <Box sx={{ border: '1px solid #020617', bgcolor: tokens.surfaceHover, px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: tokens.fontMono, color: '#334155' }}>
            {job.type}
          </Box>
        )}
        {job.location && (
          <Box sx={{ border: '1px solid #020617', bgcolor: tokens.surfaceHover, px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: tokens.fontMono, color: '#334155' }}>
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
            bgcolor: tokens.primary,
            color: tokens.accent,
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: tokens.fontMono,
            border: tokens.border,
            boxShadow: tokens.shadow,
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
          aria-label={`Analisar ATS para ${job.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAnalyzeAts(job);
            }
          }}
          sx={{
            width: '100%',
            textAlign: 'center',
            bgcolor: tokens.surface,
            color: tokens.primary,
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: tokens.fontMono,
            border: tokens.border,
            boxShadow: tokens.shadow,
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
          aria-label={`Gerar currículo para ${job.title}`}
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
            bgcolor: generatingJobKey === `${job.company}|${job.title}` ? '#94a3b8' : tokens.accent,
            color: tokens.primary,
            fontWeight: 900,
            fontSize: '0.75rem',
            py: 1.25,
            px: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: tokens.fontMono,
            border: tokens.border,
            boxShadow: tokens.shadow,
            cursor: generatingJobKey === `${job.company}|${job.title}` ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: generatingJobKey === `${job.company}|${job.title}` ? '#94a3b8' : tokens.accentHover,
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
