import type { Metadata } from 'next';
import Link from 'next/link';
import { EXTENSION_FEATURES } from '@/lib/constants/home';

export const metadata: Metadata = {
  title: 'Extensão Chrome — Radar Unificando',
  description:
    'Analise a vaga aberta na página e veja o score ATS do seu currículo, com dicas para passar em triagens automatizadas, direto de um painel lateral no Chrome.',
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'CARREGUE A EXTENSÃO',
    desc: 'Instale a extensão no Chrome (modo desenvolvedor a partir do repositório, ou pela loja quando publicada) e fixe o ícone na barra.',
  },
  {
    step: '02',
    title: 'CONECTE SUA CONTA',
    desc: 'Clique no ícone e conecte sua conta do Radar Unificando — um token seguro de extensão é gerado automaticamente.',
  },
  {
    step: '03',
    title: 'ABRA UMA VAGA',
    desc: 'Abra qualquer vaga de LinkedIn, Gupy ou InHire. O painel analisa na hora e re-analisa automaticamente quando você troca de vaga.',
  },
];

export default function ExtensaoPage() {
  return (
    <main>
      <section className="section-dark-eco">
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '56px 16px',
            textAlign: 'center',
          }}
        >
          <div className="badge-neon" style={{ marginBottom: '24px', display: 'inline-block' }}>
            EXTENSÃO CHROME
          </div>
          <h1
            style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#ccff00',
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              lineHeight: 0.95,
              marginBottom: '24px',
            }}
          >
            ANALISE A VAGA
            <br />
            NA HORA
          </h1>
          <p
            style={{
              color: '#94a3b8',
              maxWidth: '640px',
              margin: '0 auto 32px',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            A extensão Radar Unificando abre um painel lateral que lê a vaga
            aberta na página e mostra o score ATS do seu currículo — pontos
            fortes, skills faltando e dicas de ajuste — sem sair do site.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/extensao/conectar"
              className="btn-neon"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              CONECTAR EXTENSÃO
            </Link>
            <Link
              href="/"
              className="btn-dark"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              VOLTAR À HOME
            </Link>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
          <div className="badge-dark" style={{ marginBottom: '24px', display: 'inline-block' }}>
            RECURSOS
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#020617',
              fontSize: 'clamp(1.65rem, 4vw, 3rem)',
              marginBottom: '32px',
              lineHeight: 0.95,
            }}
          >
            O QUE ELA FAZ
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {EXTENSION_FEATURES.map((item) => (
              <div key={item.title} className="card-brutalist" style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '1.05rem',
                    marginBottom: '12px',
                    color: '#020617',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-dark-eco">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
          <div className="badge-neon" style={{ marginBottom: '24px', display: 'inline-block' }}>
            COMO FUNCIONA
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#ffffff',
              fontSize: 'clamp(1.65rem, 4vw, 3rem)',
              marginBottom: '32px',
              lineHeight: 0.95,
            }}
          >
            3 PASSOS
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card-brutalist card-dark" style={{ padding: '24px' }}>
                <div
                  style={{
                    color: '#ccff00',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    marginBottom: '8px',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontWeight: 900,
                    textTransform: 'uppercase',
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
        </div>
      </section>
    </main>
  );
}