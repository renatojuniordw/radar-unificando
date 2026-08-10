import Link from "next/link";
import { EXTENSION_FEATURES } from "@/lib/constants/home";
import { Gauge, RefreshCw, BarChart3, Copy, ShieldAlert, History, ArrowRight } from "lucide-react";

const FEATURE_ICONS = [Gauge, RefreshCw, BarChart3, Copy, ShieldAlert, History];

export function ExtensionSection() {
  return (
    <section className="section-dark-eco">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 16px" }}>
        <div className="badge-neon" style={{ marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span>EXTENSÃO CHROME</span>
          <span style={{ backgroundColor: "#020617", color: "#ccff00", padding: "2px 6px", fontSize: "0.7rem", border: "1px solid #ccff00" }}>
            EM BREVE
          </span>
        </div>
        <h2
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            marginBottom: "16px",
            lineHeight: 0.95,
          }}
        >
          ANALISE A VAGA NA HORA,
          <br />
          <span style={{ color: "#ccff00" }}>SEM SAIR DO SITE</span>
        </h2>
        <p
          style={{
            color: "#94a3b8",
            maxWidth: "640px",
            marginBottom: "40px",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Instale a extensão e veja o score ATS do seu currículo para cada vaga
          em um painel lateral — com re-análise automática ao trocar de vaga.
        </p>

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
                className="card-dark"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "rgba(204, 255, 0, 0.1)",
                        border: "1px solid #ccff00",
                        color: "#ccff00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        fontSize: "1.05rem",
                        color: "#ccff00",
                        margin: 0,
                      }}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            href="/extensao"
            className="btn-neon"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              fontSize: "0.95rem",
            }}
          >
            CONHECER A EXTENSÃO <ArrowRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}