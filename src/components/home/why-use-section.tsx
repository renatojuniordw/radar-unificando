import { WHY_USE_ITEMS } from "@/lib/constants/home";
import { Zap, ShieldCheck, Clock, Sparkles, Target, Bot } from "lucide-react";

const ICONS = [Zap, ShieldCheck, Clock, Sparkles, Target, Bot];

export function WhyUseSection() {
  return (
    <section className="section-white" style={{ py: "64px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 16px" }}>
        <div className="badge-dark" style={{ marginBottom: "20px", display: "inline-block" }}>
          POR QUE USAR O RADAR
        </div>
        <h2
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#f8fafc",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            marginBottom: "36px",
            lineHeight: 0.95,
          }}
        >
          TUDO QUE VOCÊ PRECISA
          <br />
          <span style={{ color: "#ccff00" }}>PARA SE RELOCAR</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {WHY_USE_ITEMS.map((item, index) => {
            const IconComponent = ICONS[index % ICONS.length];
            return (
              <div
                key={item.title}
                className="card-brutalist"
                style={{
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
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
                      color: "#f8fafc",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      color: "#94a3b8",
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
      </div>
    </section>
  );
}

