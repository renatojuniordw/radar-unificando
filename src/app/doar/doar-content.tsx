"use client";

import { useState } from "react";
import {
  Heart,
  Copy,
  Check,
  QrCode,
  Server,
  Cpu,
  Globe,
  Coffee,
  Zap,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const PIX_BRCODE =
  "00020126580014br.gov.bcb.pix013627f32c37-5109-47c2-a539-fe9fe58b4eb85204000053039865802BR5914RENATO BEZERRA6006RECIFE62070503***630475E5";
const PIX_KEY = "27f32c37-5109-47c2-a539-fe9fe58b4eb8";

const SUGGESTED_VALUES = [
  {
    icon: Coffee,
    label: "R$ 5",
    title: "CAFÉ DO DEV",
    desc: "Ajuda a pagar o café durante as madrugadas de código.",
  },
  {
    icon: Server,
    label: "R$ 15",
    title: "SERVIDORES 24H",
    desc: "Mantém o banco de dados e as buscas ao vivo no ar.",
  },
  {
    icon: Cpu,
    label: "R$ 30",
    title: "TOKENS DE IA",
    desc: "Financia os modelos de IA para cálculos ATS e Chat.",
  },
  {
    icon: Zap,
    label: "R$ 50+",
    title: "SUPER APOIO",
    desc: "Garante o desenvolvimento contínuo de novas funções.",
  },
];

const TRANSPARENCY_ITEMS = [
  {
    icon: Server,
    title: "INFRAESTRUTURA 24H",
    desc: "Hospedagem de alto desempenho, banco de dados PostgreSQL e servidores de busca ao vivo.",
  },
  {
    icon: Cpu,
    title: "MODELOS DE IA GENERATIVA",
    desc: "Custo por token dos modelos de inteligência artificial para simulação de entrevistas e score ATS.",
  },
  {
    icon: Globe,
    title: "EXTENSÃO CHROME",
    desc: "Manutenção da extensão do navegador, suporte a novas plataformas e atualizações de segurança.",
  },
];

export default function DoarContent() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_BRCODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main style={{ backgroundColor: "#020617", minHeight: "100vh", color: "#f8fafc", paddingBottom: "64px" }}>
      {/* Hero Section */}
      <section className="section-hero" style={{ padding: "64px 16px", position: "relative", overflow: "hidden" }}>
        <div
          className="hero-radar"
          style={{
            position: "absolute",
            inset: -200,
            background: "conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)",
            opacity: 0.05,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="badge-neon" style={{ marginBottom: "20px", display: "inline-block" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Heart size={14} fill="#020617" /> APOIE O RADAR UNIFICANDO
            </span>
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              textTransform: "uppercase",
              marginBottom: "24px",
              color: "#ffffff",
            }}
          >
            APOIE QUEM MANTÉM
            <br />
            <span style={{ color: "#ccff00" }}>O RADAR NO AR</span>
          </h1>

          <p
            style={{
              color: "#f8fafc",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              maxWidth: "680px",
              margin: "0 auto",
              fontWeight: 500,
            }}
          >
            Sabia que o Radar é mantido por um único desenvolvedor? O site é <strong style={{ color: "#ccff00" }}>100% gratuito</strong>, mas cada busca, análise e conversa com a IA consome tokens e servidores. Se a ferramenta te ajudou hoje, apoie o projeto com um PIX de qualquer valor.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
        {/* Main PIX Card */}
        <section style={{ marginTop: "48px", marginBottom: "56px" }}>
          <div
            className="card-dark"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              position: "relative",
              backgroundColor: "#0f172a",
              border: "3px solid #ccff00",
              boxShadow: "8px 8px 0px #ccff00",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#ccff00",
                fontWeight: 900,
                fontSize: "1.2rem",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                marginBottom: "24px",
              }}
            >
              <QrCode size={22} /> PIX (BRASIL — 100% SEM TAXA)
            </div>

            {/* QR Code Container */}
            <div style={{ marginBottom: "24px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pix-qr.png"
                alt="QR Code PIX para doação ao Radar Unificando"
                width={220}
                height={220}
                style={{
                  display: "block",
                  margin: "0 auto",
                  imageRendering: "pixelated",
                  border: "3px solid #ccff00",
                  boxShadow: "6px 6px 0px #000000",
                  backgroundColor: "#ffffff",
                  padding: "8px",
                }}
              />
            </div>

            {/* Chave PIX */}
            <div
              style={{
                backgroundColor: "#020617",
                border: "2px solid #334155",
                padding: "12px 16px",
                maxWidth: "480px",
                margin: "0 auto 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.75rem",
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Chave PIX (Aleatória):
              </span>
              <strong
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.85rem",
                  color: "#ccff00",
                  wordBreak: "break-all",
                }}
              >
                {PIX_KEY}
              </strong>
            </div>

            {/* Copy Action Button */}
            <button
              onClick={handleCopy}
              className="btn-neon"
              style={{
                padding: "16px 32px",
                fontSize: "1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: copied ? "#00ff66" : "#ccff00",
                color: "#020617",
                border: "4px solid #020617",
                boxShadow: "6px 6px 0px #000",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {copied ? (
                <>
                  <Check size={20} strokeWidth={3} /> CÓDIGO PIX COPIADO!
                </>
              ) : (
                <>
                  <Copy size={20} strokeWidth={2.5} /> COPIAR CÓDIGO PIX (COPIA E COLA)
                </>
              )}
            </button>
          </div>
        </section>

        {/* Suggested Values Section */}
        <section style={{ marginBottom: "56px" }}>
          <div className="badge-dark" style={{ marginBottom: "16px", display: "inline-block" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} /> VALORES SUGERIDOS DE APOIO
            </span>
          </div>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: "32px",
              color: "#ffffff",
            }}
          >
            ESCOLHA SEU <span style={{ color: "#ccff00" }}>NÍVEL DE APOIO</span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            {SUGGESTED_VALUES.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  className="card-brutalist"
                  style={{
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: "#ffffff",
                    border: "4px solid #020617",
                    boxShadow: "6px 6px 0px #000",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          backgroundColor: "#020617",
                          border: "2px solid #020617",
                          color: "#ccff00",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComp size={18} />
                      </div>
                      <span
                        style={{
                          fontFamily: "ui-monospace, monospace",
                          fontWeight: 900,
                          fontSize: "0.9rem",
                          color: "#020617",
                          backgroundColor: "#ccff00",
                          padding: "3px 10px",
                          border: "2px solid #020617",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        textTransform: "uppercase",
                        color: "#020617",
                        marginBottom: "8px",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{ color: "#334155", fontSize: "0.825rem", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transparency Section */}
        <section style={{ marginBottom: "56px" }}>
          <div className="badge-dark" style={{ marginBottom: "16px", display: "inline-block" }}>
            TRANSPARÊNCIA
          </div>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: "32px",
              color: "#ffffff",
            }}
          >
            ONDE SEU APOIO É <span style={{ color: "#ccff00" }}>APLICADO</span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {TRANSPARENCY_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card-brutalist"
                  style={{
                    padding: "28px 24px",
                    backgroundColor: "#ffffff",
                    border: "4px solid #020617",
                    boxShadow: "6px 6px 0px #000",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#020617",
                      border: "2px solid #020617",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                      color: "#ccff00",
                    }}
                  >
                    <ItemIcon size={20} />
                  </div>
                  <h3 style={{ fontWeight: 900, fontSize: "1.05rem", textTransform: "uppercase", marginBottom: "12px", color: "#020617" }}>
                    {item.title}
                  </h3>
                  <p style={{ color: "#334155", fontSize: "0.85rem", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transparency Link Footer */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: 0 }}>
            Quer conferir os custos detalhados do projeto? Veja o nosso{" "}
            <a
              href="https://github.com/renatobezerra/radar-unificando/blob/main/COSTS.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#ccff00",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              COSTS.md no GitHub <ExternalLink size={14} />
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
