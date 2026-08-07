'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown, ShieldCheck, Info, Puzzle } from 'lucide-react';

/**
 * Safely extracts only the first name of the user.
 * Handles whitespace, null/undefined, and fallback to email username or 'Usuário'.
 */
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

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/login"
          className="bg-[#0f172a] text-white border-2 border-[#334155] font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase px-2.5 py-1 sm:px-3.5 sm:py-1.5 no-underline font-mono transition-all hover:border-[#ccff00] hover:text-[#ccff00]"
        >
          ENTRAR
        </Link>
        <Link
          href="/register"
          className="bg-[#ccff00] text-[#020617] border-2 border-[#020617] font-black text-[10px] sm:text-[11px] tracking-wider uppercase px-2.5 py-1 sm:px-3.5 sm:py-1.5 no-underline font-mono shadow-[2px_2px_0px_#000] inline-flex items-center gap-1 sm:gap-1.5 hover:bg-[#d9ff33]"
        >
          CRIAR CONTA
        </Link>
      </div>
    );
  }

  const firstName = getFirstName(session.user.name, session.user.email);
  const fullName = session.user.name?.trim() || session.user.email || 'Usuário';
  const userInitial = firstName[0]?.toUpperCase() || 'U';

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 border-2 font-mono transition-all outline-none cursor-pointer ${
          isOpen
            ? 'bg-[#1e293b] text-white border-[#ccff00]'
            : 'bg-[#0f172a] text-white border-[#334155] hover:border-[#ccff00]'
        }`}
      >
        {/* Avatar Circle with Online Badge */}
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={firstName}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-[#ccff00]"
            />
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ccff00] text-[#020617] font-black text-[10px] sm:text-[12px] flex items-center justify-center">
              {userInitial}
            </div>
          )}
          {/* Status Indicator */}
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00ff66] rounded-full border border-[#020617]" />
        </div>

        {/* First Name Label with Truncation */}
        <span className="text-[10px] sm:text-[11px] font-bold text-[#f8fafc] max-w-[65px] xs:max-w-[85px] sm:max-w-[120px] truncate">
          {firstName}
        </span>

        <ChevronDown
          size={13}
          className={`text-[#94a3b8] transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 text-[#ccff00]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[240px] max-w-[calc(100vw-24px)] bg-[#0f172a] border-2 border-[#ccff00] shadow-[6px_6px_0px_#000] z-50 p-3">
          {/* Header info inside dropdown */}
          <div className="pb-2.5 mb-2.5 border-b border-[#1e293b]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#ccff00] text-[#020617] font-black text-sm flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-extrabold text-white m-0 truncate" title={fullName}>
                  {fullName}
                </p>
                <p className="text-[10px] text-[#94a3b8] font-mono m-0 truncate" title={session.user.email || ''}>
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* Status Chip */}
            <div className="inline-flex items-center gap-1 bg-[#ccff00]/10 border border-[#ccff00]/30 px-1.5 py-0.5 text-[9px] font-extrabold text-[#ccff00] font-mono uppercase mt-1">
              <ShieldCheck size={10} />
              <span>Conectado</span>
            </div>
          </div>

          {/* Menu Links/Actions */}
          <div className="flex flex-col gap-1">
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 text-[#f8fafc] text-xs font-bold font-mono no-underline bg-[#1e293b] border border-transparent transition-all hover:bg-[#ccff00] hover:text-[#020617]"
            >
              <User size={14} />
              <span>MEU PERFIL</span>
            </Link>

            <Link
              href="/extensao/conectar"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 text-[#f8fafc] text-xs font-bold font-mono no-underline bg-[#1e293b] border border-transparent transition-all hover:bg-[#ccff00] hover:text-[#020617]"
            >
              <Puzzle size={14} />
              <span>CONECTAR EXTENSÃO</span>
            </Link>

            {/* Quick Link to Sobre on Mobile */}
            <Link
              href="/sobre"
              onClick={() => setIsOpen(false)}
              className="flex sm:hidden items-center gap-2.5 p-2 text-[#94a3b8] text-xs font-bold font-mono no-underline bg-[#1e293b]/50 border border-transparent transition-all hover:bg-[#ccff00] hover:text-[#020617]"
            >
              <Info size={14} />
              <span>SOBRE O RADAR</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="flex items-center gap-2.5 p-2 text-[#ff4d4d] text-xs font-bold font-mono uppercase bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 transition-all hover:bg-[#ff4d4d] hover:text-white cursor-pointer w-full text-left mt-1"
            >
              <LogOut size={14} />
              <span>SAIR DA CONTA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

