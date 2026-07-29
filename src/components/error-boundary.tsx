'use client';

import { Component, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Algo deu errado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {this.state.error?.message || 'Erro inesperado'}
          </Typography>
          <Button variant="contained" size="small" onClick={() => this.setState({ hasError: false })}>
            TENTAR NOVAMENTE
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
