'use client';

import { Box, Typography, Button } from '@mui/material';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
        Erro inesperado
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error.message || 'Tente novamente'}
      </Typography>
      <Button variant="contained" color="warning" onClick={reset}>
        TENTAR NOVAMENTE
      </Button>
    </Box>
  );
}
