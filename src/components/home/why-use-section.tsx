import { WHY_USE_ITEMS } from "@/lib/constants/home";

export function WhyUseSection() {
  return (
    <section className="section-white" style={{ borderTop: "4px solid #020617" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>
        <div className="badge-dark" style={{ marginBottom: "24px", display: "inline-block" }}>
          POR QUE USAR
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
          TUDO QUE VOCÊ PRECISA
          <br />
          PARA SE RELOCAR
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {WHY_USE_ITEMS.map((item) => (
            <div key={item.title} className="card-brutalist" style={{ padding: "24px" }}>
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
                  color: "#475569",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
