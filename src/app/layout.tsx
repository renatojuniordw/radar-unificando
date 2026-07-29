import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radar Unificando — Vagas Gupy + InHire',
  description: 'Busca automática de vagas 100% remotas em Gupy e InHire para cargos de Dados, BI, Business e Growth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <header className="bg-slate-950 border-b-4 border-neon-yellow z-50 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
            <a href="/" className="bg-neon-yellow p-2 border-2 border-slate-950 shadow-hard-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_#fff] transition-all">
              <span className="text-slate-950 font-black uppercase tracking-tighter text-lg leading-none">RADAR UNIFICANDO</span>
            </a>
            <nav className="flex gap-1">
              <a href="/vagas" className="text-xs font-black uppercase tracking-widest text-white px-4 py-2 hover:bg-neon-yellow hover:text-slate-950 transition-colors">
                VAGAS
              </a>
              <a href="/empresas" className="text-xs font-black uppercase tracking-widest text-white px-4 py-2 hover:bg-neon-yellow hover:text-slate-950 transition-colors">
                EMPRESAS
              </a>
              <a href="/pipeline" className="text-xs font-black uppercase tracking-widest text-white px-4 py-2 hover:bg-neon-yellow hover:text-slate-950 transition-colors">
                PIPELINE
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-slate-950 border-t-4 border-neon-yellow py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              RADAR UNIFICANDO — BUSCA AUTOMÁTICA DE VAGAS GUPY + INHIRE
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
              PROJETO ORIGINAL{' '}
              <a href="https://github.com/anomalyco/busca-vagas-gupy-inhire" className="text-neon-yellow hover:underline" target="_blank" rel="noopener noreferrer">
                BUSCA-VAGAS-GUPY-INHIRE
              </a>
              {' '}· REESCRITO PARA WEB POR{' '}
              <a href="https://renatobezerra.com.br/" className="text-neon-yellow hover:underline" target="_blank" rel="noopener noreferrer">
                RENATO BEZERRA
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
