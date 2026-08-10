'use client';

import { Box } from '@mui/material';
import type { ReactNode } from 'react';

/** Grade responsiva padrão dos cards de curso (cursos + páginas de skill). */
export function CourseGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
        gap: 2.5,
      }}
    >
      {children}
    </Box>
  );
}
