'use client';

import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

export function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {
      /* clipboard indisponível fora de contexto seguro — falha silenciosa */
    });
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Box
      component="button"
      onClick={handleCopy}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 1,
        px: 1.25,
        py: 0.4,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: copied ? 'rgba(0, 255, 102, 0.1)' : 'grey.100',
        color: copied ? 'success.main' : 'text.secondary',
        fontSize: '0.7rem',
        fontWeight: 600,
        fontFamily: 'ui-monospace, monospace',
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
        '&:hover': {
          bgcolor: copied ? 'rgba(0, 255, 102, 0.15)' : 'grey.200',
        },
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      {copied ? 'Copiado!' : 'Copiar Texto'}
    </Box>
  );
}
