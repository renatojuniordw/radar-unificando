'use client';

import { Chip } from '@mui/material';

interface Props {
  label: string;
  matchType?: 'matched' | 'missing' | 'neutral';
  size?: 'small' | 'medium';
  onDelete?: () => void;
}

export function SkillPill({ label, matchType = 'neutral', size = 'small', onDelete }: Props) {
  const color = matchType === 'matched' ? 'success' : matchType === 'missing' ? 'error' : 'default';

  return (
    <Chip
      label={label}
      size={size}
      color={color}
      variant={matchType === 'neutral' ? 'filled' : 'outlined'}
      onDelete={onDelete}
      sx={{ fontWeight: 700, fontSize: size === 'small' ? 10 : 12 }}
    />
  );
}
