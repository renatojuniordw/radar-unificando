'use client';

import { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erro não tratado na aplicação:', error);
  }, [error]);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }} role="alert">
      <Typography variant="h1" sx={{ fontWeight: 900, mb: 1, fontSize: '1.5rem' }}>
        Algo deu errado
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ocorreu um erro inesperado. Tente novamente.
      </Typography>
      <Button variant="contained" color="warning" onClick={reset}>
        TENTAR NOVAMENTE
      </Button>
    </Box>
  );
}