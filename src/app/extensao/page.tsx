import type { Metadata } from "next";
import Link from "next/link";
import { EXTENSION_FEATURES } from "@/lib/constants/home";
import { toScriptJson } from "@/lib/core/seo/jsonld";
import { SITE, LINKS } from "@/lib/core/constants";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Extensão Chrome — Score ATS e Vagas | Radar Unificando" },
  description:
    "Analise vagas no Gupy, LinkedIn e InHire. Veja seu score ATS, keywords faltando no currículo e dicas de otimização no painel lateral do Chrome.",
  alternates: { canonical: `${SITE.url}/extensao` },
  keywords: [
    "Extensão Chrome",
    "Score ATS",
    "Análise de Currículo",
    "Vagas Gupy",
    "Vagas LinkedIn",
    "InHire",
    "Inteligência Artificial Vagas",
    "Otimização de Currículo",
    "Radar Unificando",
  ],
  openGraph: {
    title: "Extensão Chrome Radar Unificando — Score ATS e Dicas de Vagas",
    description:
      "Descubra sua compatibilidade com vagas no Gupy, LinkedIn e InHire. Receba dicas imediatas de IA para ajustar seu currículo e passar em triagens automatizadas.",
    url: `${SITE.url}/extensao`,
    type: "website",
  },
};

const JSON_LD_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Radar Unificando Chrome Extension",
  operatingSystem: "Chrome",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
  description:
    "Extensão Chrome oficial do Radar Unificando. Analisa a vaga aberta na página (Gupy, LinkedIn, InHire) e mostra o score ATS e dicas de currículo em um painel lateral.",
  url: LINKS.chromeStore,
  downloadUrl: LINKS.chromeStore,
  installUrl: LINKS.chromeStore,
  author: {
    "@type": "Person",
    name: "Renato Bezerra",
  },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Download,
    title: "INSTALE A EXTENSÃO",
    desc: "Instale direto da Chrome Web Store em um clique e fixe o ícone do Radar Unificando na barra do navegador.",
  },
  {
    step: "02",
    icon: KeyRound,
    title: "CONECTE SUA CONTA",
    desc: "Clique no ícone da extensão e conecte sua conta do Radar Unificando para gerar seu token seguro em segundos.",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "ABRA UMA VAGA E ANALISE",
    desc: "Navegue no LinkedIn, Gupy ou InHire. O painel lateral calcula seu score ATS e re-analisa sozinho a cada nova vaga.",
  },
];

const FEATURE_ICONS = [Gauge, RefreshCw, BarChart3, Copy, ShieldCheck, History];

const CTA_BASE =
  "w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 text-sm no-underline whitespace-nowrap active:scale-[0.98] transition-transform";

export default function ExtensaoPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#020617] text-[#f8fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toScriptJson(JSON_LD_SCHEMA) }}
      />

      {/* Hero Section */}
      <section
        className="section-hero relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24"
        data-testid="extensao-hero-section"
      >
        <div
          className="hero-radar pointer-events-none absolute"
          style={{
            inset: -200,
            background:
              "conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)",
            opacity: 0.03,
          }}
        />

        <div className="relative z-[1] mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-[680px] text-center">
            <div className="badge-neon mb-5">
              <span>EXTENSÃO CHROME ATS</span>
            </div>

            <h1
              className="mb-6 font-black uppercase tracking-tight text-white leading-[1.05] sm:leading-[0.95]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
            >
              ANALISE A VAGA
              <br />
              <span className="text-[#ccff00]">NA HORA EM SEU NAVEGADOR</span>
            </h1>

            <p className="mx-auto mb-8 max-w-[560px] text-base leading-relaxed text-[#cbd5e1]">
              Um painel lateral que lê a vaga no Gupy, LinkedIn e InHire e mostra
              o score ATS do seu currículo em tempo real, com as skills que
              faltam e o que ajustar.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href={LINKS.chromeStore}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="extensao-conectar-button"
                className={`btn-neon ${CTA_BASE}`}
              >
                <Download size={18} strokeWidth={3} className="shrink-0" />
                <span>INSTALAR NO CHROME</span>
              </a>
              <Link
                href="/extensao/conectar"
                data-testid="extensao-conectar-conta-link"
                className={`btn-dark ${CTA_BASE}`}
              >
                <KeyRound size={16} strokeWidth={3} className="shrink-0" />
                <span>JÁ INSTALOU? CONECTAR CONTA</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section
        className="section-dark-alt px-4 py-16 sm:px-6 sm:py-24"
        data-testid="extensao-recursos-section"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="badge-dark mb-5">FUNCIONALIDADES DA EXTENSÃO</div>
          <h2
            className="mb-10 font-black uppercase tracking-tight leading-[1.05] text-[#f8fafc] sm:leading-[0.95]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            TUDO QUE ELA FAZ <span className="text-[#ccff00]">POR VOCÊ</span>
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {EXTENSION_FEATURES.map((item, index) => {
              const IconComponent = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="card-brutalist flex flex-col p-6 sm:p-7"
                  data-testid={`extensao-feature-${item.title
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")}`}
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center border-2 border-[#ccff00] bg-[#020617] text-[#ccff00]"
                    style={{ boxShadow: "3px 3px 0px #ccff00" }}
                  >
                    <IconComponent size={22} strokeWidth={2.5} />
                  </div>
                  <h3 className="mb-3 text-lg font-black uppercase tracking-tight text-[#020617]">
                    {item.title}
                  </h3>
                  <p className="m-0 text-sm font-medium leading-relaxed text-[#334155]">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section
        className="section-dark-eco px-4 py-16 sm:px-6 sm:py-24"
        data-testid="extensao-como-funciona-section"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="badge-neon mb-5">
            <span>PASSO A PASSO</span>
          </div>
          <h2
            className="mb-10 font-black uppercase tracking-tight leading-[1.05] text-white sm:leading-[0.95]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            COMO FUNCIONA EM <span className="text-[#ccff00]">3 ETAPAS</span>
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item) => {
              const StepIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="card-dark flex flex-col p-6 sm:p-7"
                  data-testid={`extensao-etapa-${item.step}`}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className="px-3 py-1 font-mono text-base font-black text-[#020617]"
                      style={{
                        backgroundColor: "#ccff00",
                        boxShadow: "3px 3px 0px #fff",
                      }}
                    >
                      ETAPA {item.step}
                    </div>
                    <div className="flex items-center justify-center border border-[#ccff00] p-2 text-[#ccff00]">
                      <StepIcon size={22} />
                    </div>
                  </div>
                  <h3 className="mb-3 text-lg font-black uppercase tracking-tight text-[#ccff00]">
                    {item.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed text-[#cbd5e1]">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA Card */}
          <div className="mt-14 border-2 border-[#ccff00] bg-[#0f172a] p-6 text-center shadow-[4px_4px_0px_#000] sm:mt-16 sm:p-10 sm:shadow-[8px_8px_0px_#000]">
            <h3 className="mb-3 text-xl font-black uppercase text-[#f8fafc] sm:text-2xl">
              PRONTO PARA AUMENTAR SUAS CHANCES NAS VAGAS?
            </h3>
            <p className="mx-auto mb-6 max-w-[600px] text-sm text-[#94a3b8] sm:text-base">
              Instale a extensão pela Chrome Web Store, conecte sua conta do
              Radar Unificando e comece a analisar vagas agora mesmo.
            </p>
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href={LINKS.chromeStore}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="extensao-conectar-conta-button"
                className={`btn-neon ${CTA_BASE}`}
              >
                <Download size={20} strokeWidth={3} className="shrink-0" />
                <span>INSTALAR NO CHROME AGORA</span>
              </a>
              <Link
                href="/extensao/conectar"
                data-testid="extensao-conectar-conta-token-link"
                className={`btn-dark ${CTA_BASE}`}
              >
                <KeyRound size={18} strokeWidth={3} className="shrink-0" />
                <span>CONECTAR CONTA</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
