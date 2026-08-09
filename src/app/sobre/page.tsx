import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  UserCheck,
  ArrowRight,
  Code2,
  ExternalLink,
  Target,
  Rocket,
} from 'lucide-react';
import { SupportSection } from '@/components/shared/support-section';

export const metadata: Metadata = {
  title: 'Sobre — Radar Unificando',
  description:
    'Conheça o Radar Unificando: a ferramenta inteligente que consolida vagas de emprego de grandes portais (como Gupy e InHire) em tempo real.',
  openGraph: {
    title: 'Sobre — Radar Unificando',
    description:
      'Conheça o Radar Unificando: a ferramenta inteligente que consolida vagas de emprego de grandes portais em tempo real.',
  },
};

const TECH_STACK = [
  'IA Generativa & LLMs',
  'Next.js 15',
  'TypeScript',
  'React 19',
  'Prisma ORM',
  'Tailwind CSS v4',
];

export default function SobrePage() {
  return (
    <main style={{ backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', paddingBottom: '64px' }}>
      {/* Header Section */}
      <section className="section-hero" style={{ padding: '64px 16px', position: 'relative', overflow: 'hidden' }}>
        <div
          className="hero-radar"
          style={{
            position: 'absolute',
            inset: -200,
            background: 'conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)',
            opacity: 0.05,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="badge-neon" style={{ marginBottom: '20px', display: 'inline-block' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> SOBRE O RADAR UNIFICANDO
            </span>
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5vw, 4.25rem)',
              letterSpacing: '-0.02em',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              marginBottom: '24px',
              color: '#ffffff',
            }}
          >
            CONECTANDO VOCÊ ÀS
            <br />
            <span style={{ color: '#ccff00' }}>MELHORES VAGAS DO BRASIL</span>
          </h1>

          <p
            style={{
              color: '#f8fafc',
              fontFamily: 'var(--font-family-inter)',
              fontSize: '1.05rem',
              maxWidth: '720px',
              margin: '0 auto',
              lineHeight: 1.65,
              fontWeight: 500,
            }}
          >
            O Radar Unificando é uma plataforma inteligente que consolida vagas de emprego de grandes portais (como Gupy e InHire) em tempo real, cobrindo todas as áreas profissionais com análise de aderência e assistente de IA.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}>
        {/* Section 1: A Missão (Cartão Branco de Alto Contraste) */}
        <section style={{ marginTop: '48px', marginBottom: '48px' }}>
          <div
            className="card-brutalist"
            style={{
              padding: '36px 28px',
              position: 'relative',
              backgroundColor: '#ffffff',
              border: '4px solid #020617',
              boxShadow: '8px 8px 0px #000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#020617',
                  border: '2px solid #020617',
                  color: '#ccff00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={22} />
              </div>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: '1.3rem',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  color: '#020617',
                  margin: 0,
                }}
              >
                NOSSA MISSÃO: BUSCA DE VAGAS SEM COMPLICAÇÃO
              </h2>
            </div>
            <p
              style={{
                color: '#334155',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              Procurar emprego costuma ser uma tarefa exaustiva: dezenas de abas abertas, cadastros repetitivos e falta de clareza sobre quais vagas realmente combinam com seu perfil.
            </p>
            <p
              style={{
                color: '#334155',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                margin: 0,
                fontWeight: 500,
              }}
            >
              O Radar Unificando foi criado para resolver isso. Ele centraliza a pesquisa, analisa requisitos com Inteligência Artificial e ajuda profissionais de <strong style={{ color: '#020617', fontWeight: 900 }}>qualquer segmento</strong> — Marketing, RH, Vendas, Tecnologia, Finanças, Saúde, Design e Operações — a encontrarem oportunidades alinhadas às suas habilidades.
            </p>
          </div>
        </section>

        {/* Section 2: O Criador (Renato Bezerra) */}
        <section style={{ marginBottom: '48px' }}>
          <div
            className="card-dark"
            style={{
              padding: '40px 28px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              border: '3px solid #ccff00',
              boxShadow: '8px 8px 0px #ccff00',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: '#ccff00',
                  color: '#020617',
                  padding: '12px',
                  border: '2px solid #020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Code2 size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h2
                  style={{
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  QUEM DESENVOLVEU
                </h2>
                <div
                  style={{
                    color: '#ccff00',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginTop: '4px',
                  }}
                >
                  RENATO BEZERRA · CRIADOR & ENGENHEIRO DE SOFTWARE
                </div>
              </div>
            </div>

            {/* Stack Tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#ccff00',
                    backgroundColor: 'rgba(204, 255, 0, 0.12)',
                    border: '1px solid #ccff00',
                    padding: '3px 10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>

            <p
              style={{
                color: '#f8fafc',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              Olá! Sou o <strong style={{ color: '#ccff00' }}>Renato Bezerra</strong>, Engenheiro de Software com ampla experiência em desenvolvimento web, arquitetura de sistemas e soluções em Inteligência Artificial Generativa.
            </p>

            <p
              style={{
                color: '#f8fafc',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '32px',
                fontWeight: 500,
              }}
            >
              Desenvolvi o Radar Unificando para colocar a tecnologia a serviço do profissional brasileiro. A plataforma une automação em tempo real, segurança avançada de dados (LGPD) e inteligência artificial para que você passe menos tempo procurando vagas e mais tempo conquistando a oportunidade certa.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a
                href="https://renatobezerra.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  fontSize: '0.875rem',
                }}
              >
                CONHEÇA MEU PORTFÓLIO <ExternalLink size={16} />
              </a>

              <a
                href="https://unificando.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  fontSize: '0.875rem',
                  backgroundColor: '#0f172a',
                  color: '#ccff00',
                  border: '2px solid #ccff00',
                }}
              >
                <Rocket size={16} /> CONSULTORIA EM IA
              </a>
            </div>
          </div>
        </section>

        {/* Section 3: Apoie o projeto */}
        <section style={{ marginBottom: '48px' }}>
          <SupportSection />
        </section>

        {/* Section 4: Pilares */}
        <section style={{ marginBottom: '48px' }}>
          <div className="badge-dark" style={{ marginBottom: '16px', display: 'inline-block' }}>
            DIFERENCIAIS DA PLATAFORMA
          </div>
          <h2
            style={{
              fontWeight: 900,
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '32px',
              color: '#ffffff',
            }}
          >
            POR QUE O RADAR É <span style={{ color: '#ccff00' }}>DIFERENTE?</span>
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            <div
              className="card-brutalist"
              style={{
                padding: '28px 24px',
                backgroundColor: '#ffffff',
                border: '4px solid #020617',
                boxShadow: '6px 6px 0px #000',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#020617',
                  border: '2px solid #020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#ccff00',
                }}
              >
                <UserCheck size={22} />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', color: '#020617' }}>
                TODAS AS PROFISSÕES
              </h3>
              <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Vagas para qualquer área do mercado: Marketing, Vendas, RH, Financeiro, Tecnologia, Design, Operações e muito mais.
              </p>
            </div>

            <div
              className="card-brutalist"
              style={{
                padding: '28px 24px',
                backgroundColor: '#ffffff',
                border: '4px solid #020617',
                boxShadow: '6px 6px 0px #000',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#020617',
                  border: '2px solid #020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#ccff00',
                }}
              >
                <Zap size={22} />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', color: '#020617' }}>
                TEMPO REAL & MATCH IA
              </h3>
              <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Consultas diretas nos portais de vagas no momento da busca, com cálculo de compatibilidade de perfil e resumo de requisitos.
              </p>
            </div>

            <div
              className="card-brutalist"
              style={{
                padding: '28px 24px',
                backgroundColor: '#ffffff',
                border: '4px solid #020617',
                boxShadow: '6px 6px 0px #000',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#020617',
                  border: '2px solid #020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#ccff00',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', color: '#020617' }}>
                PRIVACIDADE TOTAL (LGPD)
              </h3>
              <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Dados criptografados, anonimização automática de dados sensíveis e navegação livre sem rastreamento abusivo.
              </p>
            </div>
          </div>
        </section>

        {/* Final Action Box */}
        <section style={{ marginTop: '56px' }}>
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#0f172a',
              padding: '44px 24px',
              border: '3px solid #ccff00',
              boxShadow: '8px 8px 0px #ccff00',
            }}
          >
            <h2
              style={{
                fontWeight: 900,
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                textTransform: 'uppercase',
                marginBottom: '12px',
                color: '#ffffff',
              }}
            >
              PRONTO PARA ENCONTRAR SUA PRÓXIMA VAGA?
            </h2>
            <p
              style={{
                color: '#cbd5e1',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.95rem',
                marginBottom: '28px',
              }}
            >
              100% gratuito. Comece sua pesquisa em segundos.
            </p>

            <Link
              href="/"
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
              IR PARA O MOTOR DE BUSCA <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
