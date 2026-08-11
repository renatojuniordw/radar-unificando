'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';

export function MobileFloatingBar() {
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  // Do not display on search page itself or if dismissed
  if (!isVisible || pathname === '/busca') return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-30 sm:hidden">
      <div className="bg-[#020617] border-2 border-[#ccff00] p-2.5 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-2">
        <Link
          href="/busca"
          className="flex-1 bg-[#ccff00] text-[#020617] font-black text-xs font-mono uppercase tracking-wider py-2.5 px-3 no-underline shadow-[2px_2px_0px_#fff] flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Search size={15} strokeWidth={3} />
          <span>BUSCAR VAGAS AGORA</span>
        </Link>

        <button
          onClick={() => setIsVisible(false)}
          aria-label="Fechar barra de atalho"
          className="w-9 h-9 bg-[#0f172a] text-[#94a3b8] hover:text-white border border-[#334155] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
