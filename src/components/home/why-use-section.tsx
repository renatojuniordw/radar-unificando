import { WHY_USE_ITEMS } from "@/lib/constants/home";
import { Zap, ShieldCheck, Clock, Sparkles, Target, Bot } from "lucide-react";

const ICONS = [Zap, ShieldCheck, Clock, Sparkles, Target, Bot];

export function WhyUseSection() {
  return (
    <section className="section-white py-12 sm:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="badge-dark mb-5 inline-block">
          POR QUE USAR O RADAR
        </div>
        <h2
          className="font-black uppercase tracking-tight text-white mb-8 sm:mb-10 leading-[0.95]"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
          }}
        >
          TUDO QUE VOCÊ PRECISA
          <br />
          <span style={{ color: "#ccff00" }}>PARA SE RELOCAR</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {WHY_USE_ITEMS.map((item, index) => {
            const IconComponent = ICONS[index % ICONS.length];
            return (
              <div
                key={item.title}
                className="card-brutalist p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden"
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
                      boxShadow: "3px 3px 0px #020617",
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
  );
}
