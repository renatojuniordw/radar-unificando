import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Download } from "lucide-react";
import { LINKS } from "@/lib/core/constants";

export function ExtensionSection() {
  return (
    <section className="section-dark-eco py-12 sm:py-16 border-t-2 border-[#1e293b]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="bg-[#0f172a] border-2 border-[#ccff00] p-6 sm:p-10 shadow-[8px_8px_0px_#000] relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-[680px]">
              <div className="badge-neon mb-4">
                <span>EXTENSÃO CHROME ATS</span>
              </div>

              <h2
                className="font-black uppercase tracking-tight text-white mb-3 leading-[0.95]"
                style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)" }}
              >
                ANALISE A VAGA NA HORA,{" "}
                <span className="text-[#ccff00]">DIRETO NO NAVEGADOR</span>
              </h2>

              <p className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed m-0">
                Veja o score ATS do seu currículo em um painel lateral
                inteligente no <strong>Gupy, LinkedIn e InHire</strong> — com
                re-análise automática ao trocar de vaga.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-5 text-xs font-mono text-[#94a3b8]">
                <div className="flex items-center gap-1.5 text-[#ccff00]">
                  <Zap size={14} />
                  <span>Score Automático</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#00ff66]">
                  <ShieldCheck size={14} />
                  <span>100% Seguro</span>
                </div>
              </div>

              <p className="text-[#94a3b8] text-xs font-mono mt-3 m-0">
                Grátis · requer conta gratuita para a análise ATS.
              </p>
            </div>

            <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
              <a
                data-testid="extension-install-link"
                href={LINKS.chromeStore}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon w-full md:w-auto text-center inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black font-mono uppercase tracking-wider no-underline whitespace-nowrap shadow-[4px_4px_0px_#000] active:scale-95 transition-transform"
              >
                <Download size={18} strokeWidth={3} className="shrink-0" />
                <span>INSTALAR NO CHROME</span>
              </a>
              <Link
                data-testid="extension-link"
                href="/extensao"
                className="btn-dark w-full md:w-auto text-center inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 text-xs font-black font-mono uppercase tracking-wider no-underline whitespace-nowrap"
              >
                <span>VER DETALHES</span>
                <ArrowRight size={16} strokeWidth={3} className="shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}