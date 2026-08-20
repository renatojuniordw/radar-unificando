import type { ReactNode } from 'react';
import { Box } from '@mui/material';

export function DicaCardGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
        gap: 2.5,
      }}
    >
      {children}
    </Box>
  );
}
