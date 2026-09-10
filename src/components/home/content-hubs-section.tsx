import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Hub {
  href: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
}

const HUBS: Hub[] = [
  {
    href: "/cursos",
    badge: "CURSOS RECOMENDADOS",
    title: "FECHE OS GAPS DO CURRÍCULO",
    description:
      "Cursos avulsos baratos na Udemy, recomendados pelas skills que as vagas mais pedem.",
    cta: "VER CURSOS",
  },
  {
    href: "/dicas",
    badge: "DICAS & TUTORIAIS",
    title: "DESTAQUE-SE NAS TRIAGENS",
    description:
      "Dicas práticas de currículo, ATS e entrevistas para aumentar sua compatibilidade com as vagas.",
    cta: "VER DICAS",
  },
];

export function ContentHubsSection() {
  return (
    <section className="section-dark-eco border-t-2 border-[#1e293b]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HUBS.map((hub) => {
            return (
              <div
                key={hub.href}
                className="card-dark flex flex-col gap-3 p-6 sm:p-8 h-full"
              >
                <div className="badge-neon self-start">
                  <span>{hub.badge}</span>
                </div>
                <h2
                  className="font-black uppercase tracking-tight text-white leading-[0.95] m-0"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                >
                  {hub.title}
                </h2>
                <p className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed m-0">
                  {hub.description}
                </p>
                <Link
                  data-testid={`content-hub-link-${hub.href.slice(1)}`}
                  href={hub.href}
                  className="btn-neon mt-auto w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-black font-mono uppercase tracking-wider no-underline shadow-[4px_4px_0px_#000] active:scale-95 transition-transform"
                >
                  <span>{hub.cta}</span>
                  <ArrowRight size={16} strokeWidth={3} className="shrink-0" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}