"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { MAIN_NAV_ITEMS } from "./nav-config";

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      <header className="bg-[#020617] border-b-4 border-[#ccff00] sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2 h-14">
            <Link
              href="/"
              className="no-underline flex items-center gap-1.5 sm:gap-2.5 shrink-0"
            >
              <span className="bg-[#ccff00] text-[#020617] font-black text-[0.75rem] sm:text-[0.8rem] tracking-tight border-2 border-[#020617] shadow-[2px_2px_0px_#fff] sm:shadow-[3px_3px_0px_#fff] px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
                RADAR
              </span>
              <span className="font-black tracking-tight text-white text-[0.875rem] sm:text-[1rem] whitespace-nowrap">
                UNIFICANDO
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0">
              <nav className="hidden md:flex items-center gap-2.5 lg:gap-4">
                {MAIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  if (item.highlight) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="bg-[#ccff00] text-[#020617] border-2 border-[#020617] font-black text-[0.7rem] lg:text-[0.75rem] tracking-wider uppercase px-2 py-0.5 lg:px-2.5 lg:py-1 no-underline font-mono shadow-[2px_2px_0px_#fff] transition-all hover:bg-[#d9ff33] active:scale-95 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Icon size={12} fill="currentColor" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-[#94a3b8] text-[0.7rem] lg:text-[0.75rem] font-black tracking-wider uppercase no-underline font-mono transition-colors hover:text-[#ccff00] whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <UserMenu />

              {/* Mobile Hamburger Toggle Button */}
              <button
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label="Abrir menu principal"
                aria-expanded={isMobileNavOpen}
                className="md:hidden flex items-center justify-center w-10 h-10 bg-[#0f172a] text-white border-2 border-[#334155] hover:border-[#ccff00] hover:text-[#ccff00] cursor-pointer transition-colors active:scale-95 shrink-0"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}


