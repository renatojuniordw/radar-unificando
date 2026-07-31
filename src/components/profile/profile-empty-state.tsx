'use client';

interface Props {
  onImportClick: () => void;
  onManualClick: () => void;
}

export function ProfileEmptyState({ onImportClick, onManualClick }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '4px solid #ccff00', backgroundColor: '#ccff00',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
        CRIE SEU PERFIL
      </h3>
      <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Importe seu currículo do LinkedIn para extrair automaticamente skills, experiência e formação.
      </p>

      <button
        onClick={onImportClick}
        style={{
          backgroundColor: '#020617', color: '#ccff00', fontWeight: 900,
          padding: '12px 32px', border: '4px solid #020617',
          boxShadow: '4px 4px 0px #000', cursor: 'pointer',
          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: 'ui-monospace, monospace', marginBottom: 12, display: 'block',
          width: '100%', maxWidth: 320, margin: '0 auto 12px',
        }}
      >
        IMPORTAR LINKEDIN / CURRÍCULO
      </button>

      <button
        onClick={onManualClick}
        style={{
          background: 'none', border: '2px solid #020617', color: '#020617',
          fontWeight: 700, padding: '10px 24px', cursor: 'pointer',
          fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        Preencher manualmente
      </button>
    </div>
  );
}
