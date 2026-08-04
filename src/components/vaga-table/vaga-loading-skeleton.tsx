'use client';

import { Box, Skeleton } from '@mui/material';

export function VagaLoadingSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {[1, 2, 3, 4].map(i => (
        <Box key={i} sx={{ p: 2, border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rectangular" width="40%" height={20} />
          <Skeleton variant="rectangular" width="80%" height={24} />
          <Skeleton variant="rectangular" width="60%" height={18} />
        </Box>
      ))}
    </Box>
  );
}
