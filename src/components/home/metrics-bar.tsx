import { Zap, ShieldCheck } from "lucide-react";

const METRICS = [
  {
    icon: Zap,
    value: "Gupy + InHire",
    label: "Varredura Unificada",
    subtext: "As duas maiores plataformas juntas",
  },
  {
    icon: ShieldCheck,
    value: "100% Gratuito",
    label: "Sem Assinatura",
    subtext: "Acesso livre a todas as pesquisas",
  },
];

export function MetricsBar() {
  return (
    <section className="bg-[#020617] border-y-4 border-[#ccff00] py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Accent radar grid background lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ccff00_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.04] pointer-events-none" />

      <div className="max-w-[960px] mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {METRICS.map((metric) => {
            const IconComp = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-[#0f172a] border-2 border-[#334155] p-4 sm:p-5 flex items-center gap-4 shadow-[4px_4px_0px_#000] hover:border-[#ccff00] transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-[#020617] border-2 border-[#ccff00] text-[#ccff00] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#ccff00] group-hover:scale-105 transition-transform">
                  <IconComp size={22} strokeWidth={2.5} />
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-base sm:text-lg font-black text-[#ccff00] uppercase tracking-tight m-0 font-mono">
                    {metric.value}
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider m-0 font-sans">
                    {metric.label}
                  </p>
                  <p className="text-[11px] text-[#94a3b8] font-mono m-0 truncate">
                    {metric.subtext}
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
