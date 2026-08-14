'use client';

import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  color?: string;
  mb?: number;
}

/** Rótulo de seção mono/uppercase do design system (ex.: "SKILLS MAIS PROCURADAS"). */
export function SectionEyebrow({ children, color = '#ccff00', mb = 2 }: Props) {
  return (
    <Typography
      sx={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0.7rem',
        color,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        mb,
      }}
    >
      {children}
    </Typography>
  );
}
