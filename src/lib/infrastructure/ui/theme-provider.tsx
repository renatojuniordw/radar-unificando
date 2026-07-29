'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';

type ThemeMode = 'light' | 'dark';

const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: 'light',
  toggle: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  }, []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ transition: 'background-color 0.2s' }}>
          {children}
        </div>
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
