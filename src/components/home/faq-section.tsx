import { FAQ_ITEMS } from "@/lib/constants/home";
import { HelpCircle, ChevronDown } from "lucide-react";

export function FaqSection() {
  return (
    <section className="section-faq">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 16px" }}>
        <div className="badge-dark" style={{ marginBottom: "20px", display: "inline-block" }}>
          DÚVIDAS FREQUENTES
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
          PERGUNTAS
          <br />
          <span style={{ color: "#ccff00" }}>FREQUENTES</span>
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "840px",
          }}
        >
          {FAQ_ITEMS.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <HelpCircle size={18} style={{ color: "#ccff00", flexShrink: 0 }} />
                  {faq.q}
                </span>
                <ChevronDown className="faq-arrow" size={20} />
              </summary>
              <div className="faq-content">
                <p style={{ margin: 0 }}>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

