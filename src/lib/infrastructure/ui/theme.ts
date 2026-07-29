'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#020617' },
    secondary: { main: '#64748b' },
    warning: { main: '#ccff00' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    mode: 'light',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.03em' },
    h2: { fontWeight: 900, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: { color: '#ffffff' },
        },
        {
          props: { variant: 'contained', color: 'warning' },
          style: { color: '#020617' },
        },
      ],
    },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});
