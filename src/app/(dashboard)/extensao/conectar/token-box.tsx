'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

interface TokenBoxProps {
  token: string;
}

export function TokenBox({ token }: TokenBoxProps) {
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUsedAt, setLastUsedAt] = useState<string | null>(null);

  // Toca um feedback de áudio tátil sutil ao copiar (Web Audio API)
  const playClickSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Nota D5 (Neon Bright Beep)
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignora em navegadores com áudio bloqueado
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      playClickSound();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  }, [token, playClickSound]);

  // Atalho de Teclado Global: pressionar tecla 'C' copia o token instantaneamente
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleCopy();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy]);

  // Checagem de Status da Extensão em Tempo Real (Polling a cada 4s)
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const res = await fetch('/api/extensao/status');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.connected) {
          setIsConnected(true);
          setLastUsedAt(data.lastUsedAt);
        }
      } catch {
        // Ignora erros transitórios de rede
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const maskedToken = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  const displayToken = showToken ? token : maskedToken;

  return (
    <div className="card-brutalist p-5 sm:p-6 mb-8 relative overflow-hidden group">
      {/* Visual Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ccff00] via-[#00ff66] to-[#ccff00]" />

      {/* Banner de Status de Homologação */}
      {!isConnected && (
        <div className="mb-5 bg-[#ccff00]/10 border-2 border-[#020617] p-3.5 flex items-start gap-3 shadow-[4px_4px_0px_#020617]">
          <span className="text-base shrink-0">⌛</span>
          <p className="font-mono text-xs font-bold text-[#020617] leading-relaxed m-0">
            <strong className="uppercase bg-[#020617] text-[#ccff00] px-1.5 py-0.5 mr-1">EM BREVE:</strong> 
            A extensão está em fase final de homologação no Google. Você já pode visualizar ou copiar seu token de sincronização abaixo para quando fizer o download!
          </p>
        </div>
      )}

      {/* Banner de Conexão Ao Vivo (quando detectado uso na extensão) */}
      {isConnected && (
        <div className="mb-4 bg-emerald-500/10 border-2 border-emerald-500 p-3 flex items-center justify-between gap-3 animate-fade-slide-up">
          <div className="flex items-center gap-2 text-[#020617]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            <span className="font-mono text-xs font-black uppercase tracking-wider text-[#020617]">
              Extensão Conectada & Sincronizada no Chrome!
            </span>
          </div>
          {lastUsedAt && (
            <span className="hidden sm:inline-block font-mono text-[0.65rem] font-bold text-emerald-800 uppercase">
              Último uso: {new Date(lastUsedAt).toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      )}

      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#020617]/10 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#020617]" />
          <span className="font-mono text-[0.7rem] sm:text-xs font-black uppercase tracking-widest text-[#020617]">
            Seu Token de Conexão Único
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" /> Seguro · SHA-256
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-mono font-bold uppercase tracking-wider bg-[#020617] text-[#ccff00] border border-[#020617]">
            <Sparkles className="w-3 h-3" /> {isConnected ? 'Sincronizado' : 'Ativo'}
          </span>
        </div>
      </div>

      {/* Token Display Area */}
      <div className="bg-[#020617] border-4 border-[#020617] p-4 mb-4 relative flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
        <div className="font-mono text-xs sm:text-sm font-bold text-[#f8fafc] break-all tracking-wider selection:bg-[#ccff00] selection:text-[#020617]">
          {displayToken}
        </div>

        {/* Toggle Masking Button */}
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="shrink-0 p-2 text-[#cbd5e1] hover:text-[#ccff00] hover:bg-[#0f172a] border border-transparent hover:border-[#334155] transition-all focus-visible:outline-none"
          title={showToken ? 'Ocultar token' : 'Revelar token'}
          aria-label={showToken ? 'Ocultar token para privacidade' : 'Revelar token completo'}
        >
          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Controls & Instructions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-[0.75rem] text-[#334155] font-mono leading-relaxed font-semibold">
          💡 Dica: Pressione a tecla <kbd className="bg-[#020617] text-[#ccff00] px-1.5 py-0.5 border border-[#020617] text-[0.65rem] font-bold">C</kbd> em seu teclado para copiar instantaneamente.
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className={`btn-neon shrink-0 flex items-center justify-center gap-2 px-6 py-3 text-xs font-mono font-black uppercase tracking-wider border-4 border-[#020617] transition-all transform active:scale-95 ${
            copied
              ? '!bg-[#00ff66] !text-[#020617] scale-105 shadow-[4px_4px_0px_#000]'
              : 'hover:scale-[1.03] shadow-[4px_4px_0px_#000]'
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
              <kbd className="hidden sm:inline-block font-mono bg-[#020617] text-[#ccff00] px-1.5 py-0.5 text-[0.65rem] border border-[#020617] ml-1">
                Teclas: C
              </kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
