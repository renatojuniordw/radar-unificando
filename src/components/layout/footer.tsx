'use client';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#020617',
        borderTop: '8px solid #ccff00',
        padding: '48px 24px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 48,
            paddingBottom: 48,
            borderBottom: '2px solid #1e293b',
            marginBottom: 48,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div
                style={{
                  backgroundColor: '#ccff00',
                  padding: '8px 12px',
                  border: '2px solid #020617',
                  boxShadow: '4px 4px 0px #fff',
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    color: '#020617',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                  }}
                >
                  UNIFICANDO
                </span>
              </div>
              <span
                style={{
                  fontWeight: 900,
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                ECOSSISTEMA
              </span>
            </div>
            <p
              style={{
                color: '#94a3b8',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                lineHeight: 1.8,
                maxWidth: 320,
              }}
            >
              Desenvolvido com foco total em performance e privacidade pela Unificando.
              Ferramentas rápidas, seguras e fáceis de usar.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <p
              style={{
                color: '#64748b',
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                marginBottom: 12,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              Pronto para o próximo nível?
            </p>
            <a
              href="https://unificando.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ccff00',
                border: '2px solid #ccff00',
                padding: '12px 24px',
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, monospace',
                transition: 'all 0.2s',
                boxShadow: '4px 4px 0px rgba(204,255,0,0.3)',
                maxWidth: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ccff00'; e.currentTarget.style.color = '#020617'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccff00'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(204,255,0,0.3)'; }}
            >
              CONSULTORIA EM IA E DESENVOLVIMENTO
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace', margin: 0 }}>
            © 2026 RADAR UNIFICANDO — Desenvolvido por{' '}
            <a
              href="https://renatobezerra.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ccff00'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              Renato Bezerra
            </a>
          </p>
          <nav aria-label="Rodapé">
            <ul style={{ display: 'flex', gap: 16, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
              <li>
                <a
                  href="/sobre"
                  style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: 'ui-monospace, monospace' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ccff00'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                >
                  SOBRE
                </a>
              </li>
              <li>
                <a
                  href="/termos"
                  style={{ color: '#ccff00', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: 'ui-monospace, monospace' }}
                >
                  TERMOS & PRIVACIDADE
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
