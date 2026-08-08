import type { Metadata } from 'next';
import Link from 'next/link';
import { EXTENSION_FEATURES } from '@/lib/constants/home';
import {
  Gauge,
  RefreshCw,
  BarChart3,
  Copy,
  ShieldCheck,
  History,
  Download,
  KeyRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Extensão Chrome Radar Unificando — Análise de Vagas e Score ATS Grátis',
  description:
    'Analise vagas de emprego no Gupy, LinkedIn e InHire em tempo real. Veja seu score ATS, palavras-chave de IA faltando no seu currículo e dicas de otimização direto no painel lateral do Chrome.',
  keywords: [
    'Extensão Chrome',
    'Score ATS',
    'Análise de Currículo',
    'Vagas Gupy',
    'Vagas LinkedIn',
    'InHire',
    'Inteligência Artificial Vagas',
    'Otimização de Currículo',
    'Radar Unificando',
  ],
  openGraph: {
    title: 'Extensão Chrome Radar Unificando — Score ATS e Dicas de Vagas',
    description:
      'Descubra sua compatibilidade com vagas no Gupy, LinkedIn e InHire. Receba dicas imediatas de IA para ajustar seu currículo e passar em triagens automatizadas.',
    type: 'website',
  },
};

const JSON_LD_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Radar Unificando Chrome Extension',
  operatingSystem: 'Chrome',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  description:
    'Extensão Chrome oficial do Radar Unificando. Analisa a vaga aberta na página (Gupy, LinkedIn, InHire) e mostra o score ATS e dicas de currículo em um painel lateral.',
  author: {
    '@type': 'Person',
    name: 'Renato Bezerra',
  },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Download,
    title: 'INSTALE A EXTENSÃO',
    desc: 'Carregue a extensão no Chrome a partir do repositório ou da Chrome Web Store e fixe o ícone na barra do navegador.',
  },
  {
    step: '02',
    icon: KeyRound,
    title: 'CONECTE SUA CONTA',
    desc: 'Clique no ícone da extensão e conecte sua conta do Radar Unificando para gerar seu token seguro em segundos.',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'ABRA UMA VAGA E ANALISE',
    desc: 'Navegue no LinkedIn, Gupy ou InHire. O painel lateral calcula seu score ATS e re-analisa sozinho a cada nova vaga.',
  },
];

const FEATURE_ICONS = [Gauge, RefreshCw, BarChart3, Copy, ShieldCheck, History];

export default function ExtensaoPage() {
  return (
    <main style={{ backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SCHEMA) }}
      />
      {/* Hero Section */}
      <section className="section-hero" style={{ padding: '64px 16px', position: 'relative', overflow: 'hidden' }}>
        <div
          className="hero-radar"
          style={{
            position: 'absolute',
            inset: -200,
            background: 'conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)',
            opacity: 0.03,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            {/* Left Content Column */}
            <div>
              <div className="badge-neon" style={{ marginBottom: '20px', display: 'inline-block' }}>
                ⚡ EXTENSÃO CHROME ATS
              </div>
              <h1
                style={{
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                  lineHeight: 0.95,
                  marginBottom: '24px',
                }}
              >
                ANALISE A VAGA
                <br />
                <span style={{ color: '#ccff00' }}>NA HORA EM SEU NAVEGADOR</span>
              </h1>
              <p
                style={{
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  marginBottom: '32px',
                  maxWidth: '560px',
                }}
              >
                A extensão Radar Unificando abre um painel lateral inteligente que lê a vaga aberta na página (Gupy, LinkedIn, InHire) e mostra o **score ATS** do seu currículo em tempo real — com habilidades alinhadas e recomendações de melhorias.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  href="/extensao/conectar"
                  className="btn-neon"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '16px 28px',
                    fontSize: '0.95rem',
                  }}
                >
                  CONECTAR EXTENSÃO <ArrowRight size={18} strokeWidth={3} />
                </Link>
                <Link
                  href="/"
                  className="btn-dark"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 24px',
                    fontSize: '0.95rem',
                    backgroundColor: '#0f172a',
                    color: '#94a3b8',
                    border: '2px solid #334155',
                    boxShadow: '4px 4px 0px #000',
                  }}
                >
                  <ArrowLeft size={16} /> VOLTAR À HOME
                </Link>
              </div>
            </div>

            {/* Right Column: Chrome SidePanel ATS Preview */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '2px solid #ccff00',
                boxShadow: '10px 10px 0px #000',
                padding: '24px',
                position: 'relative',
              }}
            >
              {/* Fake Chrome SidePanel Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#ccff00',
                      boxShadow: '0 0 8px #ccff00',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    RADAR ATS · PAINEL LATERAL
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'ui-monospace, monospace',
                    color: '#020617',
                    backgroundColor: '#ccff00',
                    padding: '2px 8px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  AO VIVO
                </span>
              </div>

              {/* Score Display Card */}
              <div
                style={{
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'ui-monospace, monospace',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '4px',
                    }}
                  >
                    Compatibilidade do Currículo
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: '#ccff00',
                      lineHeight: 1,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    88% <span style={{ fontSize: '0.9rem', color: '#00ff66' }}>EXCELENTE</span>
                  </div>
                </div>
                <Zap size={36} color="#ccff00" />
              </div>

              {/* Skills Tags */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'ui-monospace, monospace',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '10px',
                  }}
                >
                  Skills Identificadas na Vaga:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 255, 102, 0.1)',
                      color: '#00ff66',
                      border: '1px solid #00ff66',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} /> React / Next.js
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 255, 102, 0.1)',
                      color: '#00ff66',
                      border: '1px solid #00ff66',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} /> TypeScript
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 204, 0, 0.1)',
                      color: '#ccff00',
                      border: '1px solid #ccff00',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertCircle size={12} /> GraphQL (Faltante)
                  </span>
                </div>
              </div>

              {/* Dica ATS Box */}
              <div
                style={{
                  backgroundColor: '#020617',
                  borderLeft: '4px solid #ccff00',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  💡 <strong>Dica ATS:</strong> Adicione <em>&quot;GraphQL / REST APIs&quot;</em> no resumo profissional para subir seu score de 88% para <strong>95%</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section className="section-white" style={{ padding: '64px 16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="badge-dark" style={{ marginBottom: '20px', display: 'inline-block' }}>
            FUNCIONALIDADES DA EXTENSÃO
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#f8fafc',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              marginBottom: '40px',
              lineHeight: 0.95,
            }}
          >
            TUDO QUE ELA FAZ <span style={{ color: '#ccff00' }}>POR VOCÊ</span>
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {EXTENSION_FEATURES.map((item, index) => {
              const IconComponent = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="card-brutalist"
                  style={{
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        backgroundColor: '#020617',
                        border: '2px solid #ccff00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        color: '#ccff00',
                        boxShadow: '3px 3px 0px #ccff00',
                      }}
                    >
                      <IconComponent size={22} strokeWidth={2.5} />
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.01em',
                        fontSize: '1.1rem',
                        marginBottom: '12px',
                        color: '#f8fafc',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: '#cbd5e1',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="section-dark-eco" style={{ padding: '64px 16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="badge-neon" style={{ marginBottom: '20px', display: 'inline-block' }}>
            PASSO A PASSO
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              marginBottom: '40px',
              lineHeight: 0.95,
            }}
          >
            COMO FUNCIONA EM <span style={{ color: '#ccff00' }}>3 ETAPAS</span>
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {HOW_IT_WORKS.map((item) => {
              const StepIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="card-dark"
                  style={{
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                      }}
                    >
                      <div
                        style={{
                          color: '#020617',
                          backgroundColor: '#ccff00',
                          fontWeight: 900,
                          fontSize: '1rem',
                          padding: '4px 12px',
                          fontFamily: 'ui-monospace, monospace',
                          boxShadow: '3px 3px 0px #fff',
                        }}
                      >
                        ETAPA {item.step}
                      </div>
                      <div
                        style={{
                          padding: '8px',
                          border: '1px solid #ccff00',
                          color: '#ccff00',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <StepIcon size={22} />
                      </div>
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.01em',
                        fontSize: '1.15rem',
                        marginBottom: '12px',
                        color: '#ccff00',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: '#cbd5e1',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA Card */}
          <div
            style={{
              marginTop: '56px',
              backgroundColor: '#0f172a',
              border: '2px solid #ccff00',
              boxShadow: '8px 8px 0px #000',
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontWeight: 900,
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                color: '#f8fafc',
                marginBottom: '12px',
              }}
            >
              PRONTO PARA AUMENTAR SUAS CHANCES NAS VAGAS?
            </h3>
            <p
              style={{
                color: '#94a3b8',
                maxWidth: '600px',
                margin: '0 auto 24px',
                fontSize: '0.95rem',
              }}
            >
              Conecte sua conta do Radar Unificando à extensão e comece a analisar vagas agora mesmo.
            </p>
            <Link
              href="/extensao/conectar"
              className="btn-neon"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 36px',
                fontSize: '1rem',
              }}
            >
              CONECTAR MINHA CONTA <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}