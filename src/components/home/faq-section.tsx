import { FAQ_ITEMS } from "@/lib/constants/home";
import { ChevronDown } from "lucide-react";

export function FaqSection() {
  return (
    <section className="section-faq">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="badge-dark mb-5 inline-block">DÚVIDAS FREQUENTES</div>
        <h2
          className="mb-9 font-black uppercase tracking-tight leading-[1.05] text-[#f8fafc] sm:leading-[0.95]"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          PERGUNTAS
          <br />
          <span className="text-[#ccff00]">FREQUENTES</span>
        </h2>

        <div className="flex max-w-[840px] flex-col gap-4">
          {FAQ_ITEMS.map((faq) => (
            <details key={faq.q} data-testid="faq-item" className="faq-item">
              <summary data-testid="faq-question-button">
                <span>{faq.q}</span>
                <ChevronDown className="faq-arrow" size={20} />
              </summary>
              <div data-testid="faq-answer" className="faq-content">
                <p style={{ margin: 0 }}>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
