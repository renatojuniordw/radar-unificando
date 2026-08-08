'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

interface TokenBoxProps {
  token: string;
}

export function TokenBox({ token }: TokenBoxProps) {
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback manual copy
    }
  }

  // Mascara o token para proteger contra transmissão de tela
  const maskedToken = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  const displayToken = showToken ? token : maskedToken;

  return (
    <div className="card-brutalist p-5 sm:p-6 mb-8 relative overflow-hidden group">
      {/* Visual Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ccff00] via-[#00ff66] to-[#ccff00]" />

      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#ccff00]" />
          <span className="font-mono text-[0.7rem] sm:text-xs font-black uppercase tracking-widest text-[#94a3b8]">
            Seu Token de Conexão Único
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" /> Seguro · SHA-256
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-mono font-bold uppercase tracking-wider bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30">
            <Sparkles className="w-3 h-3" /> Ativo
          </span>
        </div>
      </div>

      {/* Token Display Area */}
      <div className="bg-[#020617] border-2 border-[#1e293b] p-4 mb-4 relative flex items-center justify-between gap-3 transition-colors group-hover:border-[#334155]">
        <div className="font-mono text-xs sm:text-sm font-bold text-[#f8fafc] break-all tracking-wider selection:bg-[#ccff00] selection:text-[#020617]">
          {displayToken}
        </div>

        {/* Toggle Masking Button */}
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="shrink-0 p-2 text-[#94a3b8] hover:text-[#ccff00] hover:bg-[#0f172a] border border-transparent hover:border-[#334155] transition-all focus-visible:outline-none"
          title={showToken ? 'Ocultar token' : 'Revelar token'}
          aria-label={showToken ? 'Ocultar token para privacidade' : 'Revelar token completo'}
        >
          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Controls & Instructions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-[0.75rem] text-[#94a3b8] font-mono leading-relaxed">
          💡 Este token foi gerado especialmente para sua sessão. Ele autoriza sua extensão Chrome sem expor sua senha.
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className={`btn-neon shrink-0 flex items-center justify-center gap-2 px-6 py-3 text-xs font-mono font-black uppercase tracking-wider border-2 border-[#020617] transition-all ${
            copied
              ? '!bg-[#00ff66] !text-[#020617] !shadow-[4px_4px_0px_#fff]'
              : 'hover:scale-[1.02]'
          }`}
          aria-label="Copiar token para a área de transferência"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Token Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2.5]" />
              <span>Copiar Token</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
