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
import { LINKS, SITE } from '@/lib/core/constants';

export const metadata: Metadata = {
  title: { absolute: 'Sobre — Nossa Missão e Como Funciona | Radar Unificando' },
  description:
    'Conheça o Radar Unificando: a ferramenta inteligente que consolida vagas de emprego de grandes portais (como Gupy e InHire) em tempo real.',
  alternates: { canonical: `${SITE.url}/sobre` },
  openGraph: {
    title: 'Sobre o Radar Unificando — Nossa Missão e Como Funciona',
    description:
      'Conheça o Radar Unificando: a ferramenta inteligente que consolida vagas de emprego de grandes portais em tempo real.',
    url: `${SITE.url}/sobre`,
    type: 'website',
  },
};

const TECH_STACK = [
  'IA Generativa & LLMs',
  'Next.js 16',
  'TypeScript',
  'React 19',
  'Prisma ORM',
  'Tailwind CSS v4',
];

const PILLARS = [
  {
    icon: UserCheck,
    title: 'TODAS AS PROFISSÕES',
    desc: 'Vagas para qualquer área do mercado: Marketing, Vendas, RH, Financeiro, Tecnologia, Design, Operações e muito mais.',
  },
  {
    icon: Zap,
    title: 'TEMPO REAL & MATCH IA',
    desc: 'Consultas diretas nos portais de vagas no momento da busca, com cálculo de compatibilidade de perfil e resumo de requisitos.',
  },
  {
    icon: ShieldCheck,
    title: 'PRIVACIDADE TOTAL (LGPD)',
    desc: 'Dados criptografados, anonimização automática de dados sensíveis e navegação livre sem rastreamento abusivo.',
  },
];

const CTA_BASE =
  'w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm no-underline whitespace-nowrap active:scale-[0.98] transition-transform';

export default function SobrePage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#020617] pb-16 text-[#f8fafc]">
      {/* Header Section */}
      <section
        className="section-hero relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
        data-testid="sobre-hero-section"
      >
        <div
          className="hero-radar pointer-events-none absolute"
          style={{
            inset: -200,
            background:
              'conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)',
            opacity: 0.05,
          }}
        />

        <div className="relative z-[1] mx-auto max-w-[960px] text-center">
          <div className="badge-neon mb-5 inline-block">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} /> SOBRE O RADAR UNIFICANDO
            </span>
          </div>

          <h1
            className="mb-6 font-black uppercase tracking-tight leading-[1.05] text-white sm:leading-[0.95]"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4.25rem)' }}
          >
            CONECTANDO VOCÊ ÀS
            <br />
            <span className="text-[#ccff00]">MELHORES VAGAS DO BRASIL</span>
          </h1>

          <p className="mx-auto max-w-[720px] text-base font-medium leading-relaxed text-[#f8fafc]">
            O Radar Unificando é uma plataforma inteligente que consolida vagas
            de emprego de grandes portais (como Gupy e InHire) em tempo real,
            cobrindo todas as áreas profissionais com análise de aderência e
            assistente de IA.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        {/* Section 1: A Missão (Cartão Branco de Alto Contraste) */}
        <section data-testid="sobre-missao-section" className="mt-12 sm:mt-16">
          <div className="card-brutalist relative p-6 sm:p-9">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center border-2 border-[#020617] bg-[#020617] p-2 text-[#ccff00]">
                <Target size={22} />
              </div>
              <h2 className="m-0 text-xl font-black uppercase tracking-tight text-[#020617]">
                NOSSA MISSÃO: BUSCA DE VAGAS SEM COMPLICAÇÃO
              </h2>
            </div>
            <p className="mb-4 text-[0.95rem] font-medium leading-relaxed text-[#334155]">
              Procurar emprego costuma ser uma tarefa exaustiva: dezenas de abas
              abertas, cadastros repetitivos e falta de clareza sobre quais vagas
              realmente combinam com seu perfil.
            </p>
            <p className="m-0 text-[0.95rem] font-medium leading-relaxed text-[#334155]">
              O Radar Unificando foi criado para resolver isso. Ele centraliza a
              pesquisa, analisa requisitos com Inteligência Artificial e ajuda
              profissionais de{' '}
              <strong className="font-black text-[#020617]">
                qualquer segmento
              </strong>{' '}
              — Marketing, RH, Vendas, Tecnologia, Finanças, Saúde, Design e
              Operações — a encontrarem oportunidades alinhadas às suas
              habilidades.
            </p>
          </div>
        </section>

        {/* Section 2: O Criador (Renato Bezerra) */}
        <section data-testid="sobre-criador-section" className="mt-12 sm:mt-16">
          <div className="card-dark relative overflow-hidden p-6 sm:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center justify-center border-2 border-[#020617] bg-[#ccff00] p-3 text-[#020617]">
                <Code2 size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="m-0 text-2xl font-black uppercase leading-tight tracking-tight text-white">
                  QUEM DESENVOLVEU
                </h2>
                <div className="mt-1 font-mono text-[0.85rem] font-bold uppercase text-[#ccff00]">
                  RENATO BEZERRA · CRIADOR &amp; ENGENHEIRO DE SOFTWARE
                </div>
              </div>
            </div>

            {/* Stack Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="border border-[#ccff00] bg-[#ccff00]/[0.12] px-2.5 py-[3px] font-mono text-[0.725rem] font-bold uppercase text-[#ccff00]"
                >
                  {tech}
                </span>
              ))}
            </div>

            <p className="mb-4 text-[0.95rem] font-medium leading-relaxed text-[#f8fafc]">
              Olá! Sou o{' '}
              <strong className="text-[#ccff00]">Renato Bezerra</strong>,
              Engenheiro de Software com ampla experiência em desenvolvimento
              web, arquitetura de sistemas e soluções em Inteligência Artificial
              Generativa.
            </p>

            <p className="mb-8 text-[0.95rem] font-medium leading-relaxed text-[#f8fafc]">
              Desenvolvi o Radar Unificando — projeto autoral do{' '}
              <strong className="text-[#ccff00]">laboratório Unificando</strong> —
              para colocar a tecnologia a serviço do profissional brasileiro. A
              plataforma une automação em tempo real, segurança avançada de dados
              (LGPD) e inteligência artificial para que você passe menos tempo
              procurando vagas e mais tempo conquistando a oportunidade certa.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <a
                href={LINKS.portfolio}
                data-testid="sobre-portfolio-link"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-neon ${CTA_BASE}`}
              >
                <span>CONHEÇA MEU PORTFÓLIO</span>
                <ExternalLink size={16} strokeWidth={3} className="shrink-0" />
              </a>

              <a
                href={LINKS.unificando}
                data-testid="sobre-laboratorio-link"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-dark ${CTA_BASE}`}
              >
                <Rocket size={16} strokeWidth={3} className="shrink-0" />
                <span>CONHEÇA O LABORATÓRIO</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section 3: Apoie o projeto */}
        <section data-testid="sobre-apoio-section" className="mt-12 sm:mt-16">
          <SupportSection />
        </section>

        {/* Section 4: Pilares */}
        <section data-testid="sobre-pilares-section" className="mt-12 sm:mt-16">
          <div className="badge-dark mb-4 inline-block">
            DIFERENCIAIS DA PLATAFORMA
          </div>
          <h2
            className="mb-8 font-black uppercase tracking-tight leading-[1.05] text-white sm:leading-[0.95]"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
          >
            POR QUE O RADAR É <span className="text-[#ccff00]">DIFERENTE?</span>
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="card-brutalist p-6 sm:p-7">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border-2 border-[#020617] bg-[#020617] text-[#ccff00]">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-3 text-lg font-black uppercase text-[#020617]">
                    {pillar.title}
                  </h3>
                  <p className="m-0 text-sm font-medium leading-relaxed text-[#334155]">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final Action Box */}
        <section data-testid="sobre-cta-section" className="mt-14 sm:mt-16">
          <div className="border-[3px] border-[#ccff00] bg-[#0f172a] p-6 text-center shadow-[4px_4px_0px_#ccff00] sm:p-11 sm:shadow-[8px_8px_0px_#ccff00]">
            <h2
              className="mb-3 font-black uppercase text-white"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
            >
              PRONTO PARA ENCONTRAR SUA PRÓXIMA VAGA?
            </h2>
            <p className="mb-7 font-mono text-[0.95rem] text-[#cbd5e1]">
              100% gratuito. Comece sua pesquisa em segundos.
            </p>

            <Link
              href="/"
              data-testid="sobre-motor-busca-link"
              className={`btn-neon ${CTA_BASE} sm:py-4 sm:text-base`}
            >
              <span>IR PARA O MOTOR DE BUSCA</span>
              <ArrowRight size={20} strokeWidth={3} className="shrink-0" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
