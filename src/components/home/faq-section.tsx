import { FAQ_ITEMS } from "@/lib/constants/home";

export function FaqSection() {
  return (
    <section className="section-faq">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>
        <div className="badge-dark" style={{ marginBottom: "24px", display: "inline-block" }}>
          FAQ
        </div>
        <h2
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#020617",
            fontSize: "clamp(1.65rem, 4vw, 3rem)",
            marginBottom: "32px",
            lineHeight: 0.95,
          }}
        >
          PERGUNTAS
          <br />
          FREQUENTES
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "800px",
          }}
        >
          {FAQ_ITEMS.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>
                <span>{faq.q}</span>
                <span className="faq-arrow">↓</span>
              </summary>
              <div className="faq-content">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
