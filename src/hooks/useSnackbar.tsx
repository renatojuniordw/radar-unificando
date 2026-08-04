'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface SnackbarItem {
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface SnackbarContextType {
  show: (message: string, severity: AlertColor, options?: { duration?: number }) => void;
}

const SnackbarContext = createContext<SnackbarContextType>({ show: () => {} });

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<SnackbarItem | null>(null);

  const show = useCallback((message: string, severity: AlertColor, options?: { duration?: number }) => {
    setItem({ message, severity, duration: options?.duration });
  }, []);

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {item && (
        <Snackbar
          open
          autoHideDuration={item.duration ?? 4000}
          onClose={() => setItem(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={item.severity} variant="filled" onClose={() => setItem(null)}>
            {item.message}
          </Alert>
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
}
