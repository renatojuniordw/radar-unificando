import Link from "next/link";
import { ArrowRight, Puzzle, Zap, ShieldCheck } from "lucide-react";

export function ExtensionSection() {
  return (
    <section className="section-dark-eco py-12 sm:py-16 border-t-2 border-[#1e293b]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="bg-[#0f172a] border-2 border-[#ccff00] p-6 sm:p-10 shadow-[8px_8px_0px_#000] relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-[680px]">
              <div className="badge-neon mb-4 inline-flex items-center gap-2">
                <Puzzle size={14} />
                <span>EXTENSÃO CHROME ATS</span>
                <span className="bg-[#020617] text-[#ccff00] px-1.5 py-0.5 text-[10px] font-mono border border-[#ccff00]">
                  EM BREVE
                </span>
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
            </div>

            <div className="w-full md:w-auto shrink-0">
              <Link
                href="/extensao"
                className="btn-neon w-full md:w-auto text-center inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black font-mono uppercase tracking-wider no-underline whitespace-nowrap shadow-[4px_4px_0px_#000] active:scale-95 transition-transform"
              >
                <span>VER DETALHES DA EXTENSÃO</span>
                <ArrowRight size={18} strokeWidth={3} className="shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}