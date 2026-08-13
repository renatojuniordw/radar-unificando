'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  X,
  Puzzle,
  User,
  LogOut,
  ShieldCheck,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';
import { LINKS } from '@/lib/core/constants';

import { MAIN_NAV_ITEMS } from './nav-config';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

function getFirstName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const first = name.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (email && email.trim()) {
    const emailName = email.trim().split('@')[0];
    if (emailName) return emailName;
  }
  return 'Usuário';
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { data: session } = useSession();

  // Prevent background scrolling when menu is open & listen to Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const firstName = getFirstName(session?.user?.name, session?.user?.email);
  const fullName = session?.user?.name?.trim() || session?.user?.email || 'Usuário';
  const userInitial = firstName[0]?.toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-start">
      {/* Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-down / Full Drawer Container */}
      <div className="relative w-full max-h-[92vh] bg-[#020617] border-b-4 border-[#ccff00] shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden z-10">
        {/* Header Bar inside Drawer */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e293b] bg-[#0f172a]">
          <Link
            href="/"
            onClick={onClose}
            className="no-underline flex items-center gap-2"
          >
            <span className="bg-[#ccff00] text-[#020617] font-black text-xs tracking-tight border-2 border-[#020617] shadow-[2px_2px_0px_#fff] px-2 py-0.5 whitespace-nowrap">
              RADAR
            </span>
            <span className="font-black tracking-tight text-white text-sm whitespace-nowrap">
              UNIFICANDO
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="w-11 h-11 bg-[#1e293b] text-[#94a3b8] hover:text-[#ccff00] hover:border-[#ccff00] border-2 border-[#334155] flex items-center justify-center cursor-pointer transition-colors active:scale-95 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 pb-20 flex flex-col gap-4">
          {/* User Status / Authentication Card */}
          <div className="bg-[#0f172a] border-2 border-[#334155] p-3.5 shadow-[4px_4px_0px_#000]">
            {session?.user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 pb-3 border-b border-[#1e293b]">
                  <div className="relative w-10 h-10 shrink-0">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={firstName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#ccff00]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#ccff00] text-[#020617] font-black text-base flex items-center justify-center">
                        {userInitial}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff66] rounded-full border border-[#020617]" />
                  </div>

                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-white m-0 truncate" title={fullName}>
                        {fullName}
                      </p>
                    </div>
                    <p className="text-xs text-[#94a3b8] font-mono m-0 truncate" title={session.user.email || ''}>
                      {session.user.email}
                    </p>
                    <div className="inline-flex items-center gap-1 bg-[#ccff00]/10 border border-[#ccff00]/30 px-1.5 py-0.5 text-[9px] font-extrabold text-[#ccff00] font-mono uppercase mt-1">
                      <ShieldCheck size={10} />
                      <span>Conectado</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/perfil"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2.5 px-2.5 bg-[#1e293b] text-white text-xs font-mono font-bold no-underline border border-[#334155] hover:border-[#ccff00] hover:text-[#ccff00] transition-all active:scale-95"
                  >
                    <User size={14} />
                    <span>PERFIL</span>
                  </Link>

                  <Link
                    href="/extensao/conectar"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2.5 px-2.5 bg-[#1e293b] text-white text-xs font-mono font-bold no-underline border border-[#334155] hover:border-[#ccff00] hover:text-[#ccff00] transition-all active:scale-95"
                  >
                    <Puzzle size={14} />
                    <span>EXTENSÃO</span>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    signOut();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 text-xs font-mono font-extrabold uppercase hover:bg-[#ff4d4d] hover:text-white cursor-pointer transition-all w-full text-center active:scale-95"
                >
                  <LogOut size={14} />
                  <span>SAIR DA CONTA</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider m-0 font-bold">
                  Acesse sua conta para salvar vagas e calcular score
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="bg-[#0f172a] text-white border-2 border-[#334155] font-extrabold text-xs tracking-wider uppercase py-2.5 text-center no-underline font-mono transition-all hover:border-[#ccff00] hover:text-[#ccff00] active:scale-95 flex items-center justify-center min-h-[44px]"
                  >
                    ENTRAR
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="bg-[#ccff00] text-[#020617] border-2 border-[#020617] font-black text-xs tracking-wider uppercase py-2.5 text-center no-underline font-mono shadow-[2px_2px_0px_#000] hover:bg-[#d9ff33] active:scale-95 flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    <Sparkles size={13} />
                    <span>CRIAR CONTA</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <p className="text-[10px] font-mono text-[#64748b] uppercase tracking-widest px-1 font-bold">
              NAVEGAÇÃO PRINCIPAL
            </p>

            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 min-h-[44px] bg-[#ccff00]/10 text-[#ccff00] border-2 border-[#ccff00] no-underline font-mono text-xs font-black uppercase tracking-wider hover:bg-[#ccff00] hover:text-[#020617] transition-all shadow-[2px_2px_0px_#ccff00] active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} fill="currentColor" />
                      <span>{item.mobileLabel}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono underline">{item.badge}</span>
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 min-h-[44px] bg-[#0f172a] text-white border-2 border-[#334155] no-underline font-mono text-xs font-black uppercase tracking-wider hover:border-[#ccff00] hover:text-[#ccff00] transition-colors active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className="text-[#ccff00]" />
                    <span>{item.mobileLabel}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-[#020617] text-[#ccff00] border border-[#ccff00] px-1.5 py-0.5 text-[9px] font-black tracking-wider">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-[#64748b]" />
                  )}
                </Link>
              );
            })}

            <Link
              href="/termos"
              onClick={onClose}
              className="flex items-center justify-between p-3 min-h-[44px] bg-[#0f172a] text-[#94a3b8] border border-[#1e293b] no-underline font-mono text-xs font-bold uppercase tracking-wider hover:text-white transition-colors active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} />
                <span>TERMOS & PRIVACIDADE</span>
              </div>
              <ChevronRight size={14} />
            </Link>
          </nav>

          {/* Consultancy Banner inside Menu Footer */}
          <div className="mt-2 pt-3 border-t border-[#1e293b] flex flex-col gap-2">
            <a
              href={LINKS.unificando}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#94a3b8] font-mono no-underline uppercase tracking-wider flex items-center justify-between hover:text-[#ccff00] transition-colors"
            >
              <span>Ecossistema Unificando</span>
              <span className="text-[#ccff00]">unificando.com.br →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
