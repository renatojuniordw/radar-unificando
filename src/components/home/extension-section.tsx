import Link from 'next/link';
import { EXTENSION_FEATURES } from '@/lib/constants/home';

export function ExtensionSection() {
  return (
    <section className="section-dark-eco">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
        <div className="badge-neon" style={{ marginBottom: '24px', display: 'inline-block' }}>
          EXTENSÃO CHROME
        </div>
        <h2
          style={{
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            fontSize: 'clamp(1.65rem, 4vw, 3rem)',
            marginBottom: '16px',
            lineHeight: 0.95,
          }}
        >
          ANALISE A VAGA NA HORA,
          <br />
          SEM SAIR DO SITE
        </h2>
        <p
          style={{
            color: '#94a3b8',
            maxWidth: '640px',
            marginBottom: '32px',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          Instale a extensão e veja o score ATS do seu currículo para cada vaga
          em um painel lateral — com re-análise automática ao trocar de vaga.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {EXTENSION_FEATURES.map((item) => (
            <div key={item.title} className="card-brutalist card-dark" style={{ padding: '24px' }}>
              <h3
                style={{
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  fontSize: '1.05rem',
                  marginBottom: '12px',
                  color: '#ccff00',
                }}
              >
                {item.title}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link
            href="/extensao"
            className="btn-neon"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            CONHECER A EXTENSÃO
          </Link>
        </div>
      </div>
    </section>
  );
}