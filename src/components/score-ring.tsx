'use client';

import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';

interface Props {
  score: number;
  size?: number;
  thickness?: number;
  showLabel?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#ffaa00';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Match excelente';
  if (score >= 60) return 'Bom match';
  if (score >= 40) return 'Match médio';
  return 'Match baixo';
}

export function ScoreRing({ score, size = 60, thickness = 4, showLabel = true, clickable, onClick }: Props) {
  const color = getScoreColor(score);

  const content = (
    <Box
      sx={{
        position: 'relative', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
        '&:hover': clickable ? { opacity: 0.8 } : {},
      }}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        sx={{ color: '#e2e8f0', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={size}
        thickness={thickness}
        sx={{ color, transform: 'rotate(-90deg) !important' }}
      />
      {showLabel && (
        <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 900, color, lineHeight: 1 }}>
            {score}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (clickable) {
    return (
      <Tooltip title={getScoreLabel(score)} arrow placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
}
