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

export default function ExtensaoPage() {
  return (
    <main
      style={{
        backgroundColor: "#020617",
        minHeight: "100vh",
        color: "#f8fafc",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toScriptJson(JSON_LD_SCHEMA) }}
      />
      {/* Hero Section */}
      <section
        className="section-hero"
        data-testid="extensao-hero-section"
        style={{
          padding: "64px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="hero-radar"
          style={{
            position: "absolute",
            inset: -200,
            background:
              "conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)",
            opacity: 0.03,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}
          >
            <div>
              <div className="badge-neon" style={{ marginBottom: "20px" }}>
                <span>EXTENSÃO CHROME ATS</span>
              </div>

              <h1
                style={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  fontSize: "clamp(2.2rem, 5vw, 4rem)",
                  lineHeight: 0.95,
                  marginBottom: "24px",
                }}
              >
                ANALISE A VAGA
                <br />
                <span style={{ color: "#ccff00" }}>
                  NA HORA EM SEU NAVEGADOR
                </span>
              </h1>
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  marginBottom: "32px",
                  maxWidth: "560px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Um painel lateral que lê a vaga no Gupy, LinkedIn e InHire e
                mostra o score ATS do seu currículo em tempo real, com as skills
                que faltam e o que ajustar.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <a
                  href={LINKS.chromeStore}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="extensao-conectar-button"
                  className="btn-neon"
                  style={{
                    gap: "10px",
                    padding: "16px 28px",
                    fontSize: "0.95rem",
                    textDecoration: "none",
                  }}
                >
                  <Download size={18} /> INSTALAR NO CHROME
                </a>
                <Link
                  href="/extensao/conectar"
                  className="btn-dark"
                  data-testid="extensao-conectar-conta-link"
                  style={{
                    gap: "8px",
                    padding: "16px 24px",
                    fontSize: "0.95rem",
                    textDecoration: "none",
                  }}
                >
                  <KeyRound size={16} /> JÁ INSTALOU? CONECTAR CONTA
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section
        className="section-dark-alt"
        data-testid="extensao-recursos-section"
        style={{ padding: "64px 16px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div className="badge-dark" style={{ marginBottom: "20px" }}>
            FUNCIONALIDADES DA EXTENSÃO
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#f8fafc",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              marginBottom: "40px",
              lineHeight: 0.95,
            }}
          >
            TUDO QUE ELA FAZ <span style={{ color: "#ccff00" }}>POR VOCÊ</span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {EXTENSION_FEATURES.map((item, index) => {
              const IconComponent = FEATURE_ICONS[index % FEATURE_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="card-brutalist"
                  data-testid={`extensao-feature-${item.title
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")}`}
                  style={{
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: "#020617",
                        border: "2px solid #ccff00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px",
                        color: "#ccff00",
                        boxShadow: "3px 3px 0px #ccff00",
                      }}
                    >
                      <IconComponent size={22} strokeWidth={2.5} />
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        fontSize: "1.1rem",
                        marginBottom: "12px",
                        color: "#020617",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: "#334155",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        margin: 0,
                        fontWeight: 500,
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
      <section
        className="section-dark-eco"
        data-testid="extensao-como-funciona-section"
        style={{ padding: "64px 16px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div className="badge-neon" style={{ marginBottom: "20px" }}>
            PASSO A PASSO
          </div>
          <h2
            style={{
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#ffffff",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              marginBottom: "40px",
              lineHeight: 0.95,
            }}
          >
            COMO FUNCIONA EM <span style={{ color: "#ccff00" }}>3 ETAPAS</span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {HOW_IT_WORKS.map((item) => {
              const StepIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="card-dark"
                  data-testid={`extensao-etapa-${item.step}`}
                  style={{
                    padding: "32px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          color: "#020617",
                          backgroundColor: "#ccff00",
                          fontWeight: 900,
                          fontSize: "1rem",
                          padding: "4px 12px",
                          fontFamily: "ui-monospace, monospace",
                          boxShadow: "3px 3px 0px #fff",
                        }}
                      >
                        ETAPA {item.step}
                      </div>
                      <div
                        style={{
                          padding: "8px",
                          border: "1px solid #ccff00",
                          color: "#ccff00",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <StepIcon size={22} />
                      </div>
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        fontSize: "1.15rem",
                        marginBottom: "12px",
                        color: "#ccff00",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: "#cbd5e1",
                        fontSize: "0.875rem",
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
              marginTop: "56px",
              backgroundColor: "#0f172a",
              border: "2px solid #ccff00",
              boxShadow: "8px 8px 0px #000",
              padding: "36px 24px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontWeight: 900,
                fontSize: "1.5rem",
                textTransform: "uppercase",
                color: "#f8fafc",
                marginBottom: "12px",
              }}
            >
              PRONTO PARA AUMENTAR SUAS CHANCES NAS VAGAS?
            </h3>
            <p
              style={{
                color: "#94a3b8",
                maxWidth: "600px",
                margin: "0 auto 24px",
                fontSize: "0.95rem",
              }}
            >
              Instale a extensão pela Chrome Web Store, conecte sua conta do
              Radar Unificando e comece a analisar vagas agora mesmo.
            </p>
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <a
                href={LINKS.chromeStore}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="extensao-conectar-conta-button"
                className="btn-neon"
                style={{
                  gap: "10px",
                  padding: "16px 36px",
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                <Download size={20} /> INSTALAR NO CHROME AGORA
              </a>
              <Link
                href="/extensao/conectar"
                data-testid="extensao-conectar-conta-token-link"
                className="btn-dark"
                style={{
                  gap: "8px",
                  padding: "16px 28px",
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                <KeyRound size={18} /> CONECTAR CONTA
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
