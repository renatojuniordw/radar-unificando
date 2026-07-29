'use client';

import { Box, Typography, CircularProgress } from '@mui/material';

interface Props {
  score: number;
  size?: number;
  thickness?: number;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#ffaa00';
  return '#dc2626';
}

export function ScoreRing({ score, size = 60, thickness = 4, showLabel = true }: Props) {
  const color = getScoreColor(score);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
}
