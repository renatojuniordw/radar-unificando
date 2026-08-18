interface StatCardProps {
  label: string;
  value: number | string;
  detail?: string;
  /** 0–100; renderiza uma barra de progresso sob o valor. */
  progress?: number;
}

export function StatCard({ label, value, detail, progress }: StatCardProps) {
  const clamped = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <div className="card-brutalist" style={{ padding: 20 }}>
      <p
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#475569',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '1.9rem',
          fontWeight: 900,
          lineHeight: 1.1,
          color: '#020617',
          margin: '8px 0 0',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
      {clamped !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          style={{ height: 8, backgroundColor: '#e2e8f0', marginTop: 12, border: '1px solid #020617' }}
        >
          <div
            style={{
              width: `${clamped}%`,
              height: '100%',
              backgroundColor: clamped >= 80 ? '#ef4444' : '#ccff00',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
      {detail && (
        <p
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#475569',
            margin: '8px 0 0',
          }}
        >
          {detail}
        </p>
      )}
    </div>
  );
}