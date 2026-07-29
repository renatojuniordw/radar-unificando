'use client';

import { createTheme } from '@mui/material/styles';

const buttonVariants = [
  { props: { variant: 'contained' as const, color: 'primary' as const }, style: { color: '#ffffff' } },
  { props: { variant: 'contained' as const, color: 'warning' as const }, style: { color: '#020617' } },
];

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#020617' },
    secondary: { main: '#64748b' },
    warning: { main: '#ccff00' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
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
    MuiButton: { defaultProps: { disableElevation: true }, variants: buttonVariants },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e2e8f0' },
    secondary: { main: '#94a3b8' },
    warning: { main: '#ccff00' },
    success: { main: '#4ade80' },
    error: { main: '#ef4444' },
    background: { default: '#0f172a', paper: '#1e293b' },
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
    MuiButton: { defaultProps: { disableElevation: true }, variants: buttonVariants },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});
