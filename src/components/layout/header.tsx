'use client';

import Link from 'next/link';
import { UserMenu } from './user-menu';

export function Header() {
  return (
    <header className="bg-[#020617] border-b-4 border-[#ccff00] sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 h-14">
          <Link href="/" className="no-underline flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span className="bg-[#ccff00] text-[#020617] font-black text-[0.75rem] sm:text-[0.8rem] tracking-tight border-2 border-[#020617] shadow-[2px_2px_0px_#fff] sm:shadow-[3px_3px_0px_#fff] px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
              RADAR
            </span>
            <span className="font-black tracking-tight text-white text-[0.875rem] sm:text-[1rem] whitespace-nowrap">
              UNIFICANDO
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/busca"
              className="hidden sm:inline-flex text-[#94a3b8] text-[0.75rem] font-black tracking-wider uppercase no-underline font-mono transition-colors hover:text-[#ccff00]"
            >
              BUSCA
            </Link>

            <Link
              href="/cursos"
              className="hidden sm:inline-flex text-[#94a3b8] text-[0.75rem] font-black tracking-wider uppercase no-underline font-mono transition-colors hover:text-[#ccff00]"
            >
              CURSOS
            </Link>

            <Link
              href="/sobre"
              className="hidden sm:inline-flex text-[#94a3b8] text-[0.75rem] font-black tracking-wider uppercase no-underline font-mono transition-colors hover:text-[#ccff00]"
            >
              SOBRE
            </Link>

            <Link
              href="/extensao"
              className="hidden sm:inline-flex text-[#94a3b8] text-[0.75rem] font-black tracking-wider uppercase no-underline font-mono transition-colors hover:text-[#ccff00]"
            >
              EXTENSÃO
            </Link>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

