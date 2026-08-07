'use client';

import { useState } from 'react';

export function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        backgroundColor: copied ? '#16a34a' : '#ccff00',
        color: '#020617',
        border: '2px solid #020617',
        fontWeight: 900,
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '10px 18px',
        fontFamily: 'ui-monospace, monospace',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px #000',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar token'}
    </button>
  );
}
