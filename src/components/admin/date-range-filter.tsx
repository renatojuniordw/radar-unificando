'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRESETS = [
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '1 ano', days: 365 },
];

interface Props {
  days: number;
  from?: string;
  to?: string;
}

const buttonStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '8px 12px',
  border: '2px solid #020617',
  background: active ? '#ccff00' : '#ffffff',
  color: '#020617',
  cursor: 'pointer',
});

const inputStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.75rem',
  padding: '8px 10px',
  border: '2px solid #020617',
  background: '#ffffff',
  color: '#020617',
};

/** Filtro de período do dashboard: presets (15/30/365) ou intervalo personalizado. */
export function DateRangeFilter({ days, from, to }: Props) {
  const router = useRouter();
  const isCustom = Boolean(from && to);
  const [mode, setMode] = useState<'preset' | 'custom'>(isCustom ? 'custom' : 'preset');
  const [fromVal, setFromVal] = useState(from ?? '');
  const [toVal, setToVal] = useState(to ?? '');

  const applyPreset = (d: number) => router.push(`/admin?days=${d}`);
  const applyCustom = () => {
    if (fromVal && toVal && fromVal <= toVal) {
      router.push(`/admin?from=${fromVal}&to=${toVal}`);
    }
  };

  return (
    <div
      className="card-brutalist"
      style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.65rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#64748b',
        }}
      >
        Período:
      </span>
      {PRESETS.map((p) => (
        <button key={p.days} type="button" onClick={() => applyPreset(p.days)} style={buttonStyle(!isCustom && days === p.days)}>
          {p.label}
        </button>
      ))}
      <button type="button" onClick={() => setMode('custom')} style={buttonStyle(isCustom)}>
        Personalizado
      </button>
      {mode === 'custom' && (
        <>
          <input type="date" value={fromVal} onChange={(e) => setFromVal(e.target.value)} style={inputStyle} aria-label="De" />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', color: '#64748b' }}>até</span>
          <input type="date" value={toVal} onChange={(e) => setToVal(e.target.value)} style={inputStyle} aria-label="Até" />
          <button type="button" onClick={applyCustom} disabled={!fromVal || !toVal} style={buttonStyle(false)}>
            Aplicar
          </button>
        </>
      )}
    </div>
  );
}