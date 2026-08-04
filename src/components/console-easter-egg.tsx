"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __RADAR_EASTER_EGG_LOGGED__?: boolean;
  }
}

export function ConsoleEasterEgg() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Evita duplicar logs no StrictMode
    if (window.__RADAR_EASTER_EGG_LOGGED__) return;
    window.__RADAR_EASTER_EGG_LOGGED__ = true;

    console.log(
      "%c RADAR UNIFICANDO ",
      "background: #ccff00; color: #020617; font-weight: 900; font-size: 16px; padding: 6px 12px; border: 2px solid #020617; font-family: sans-serif;"
    );
    console.log(
      "%c 🚀 Motor de Busca de Vagas & Assistente de Carreira ",
      "background: #020617; color: #ccff00; font-weight: 700; font-size: 13px; padding: 4px 8px; font-family: sans-serif;"
    );
    console.log(
      "%cEste projeto é ofertado pela Unificando e desenvolvido por Renato Bezerra.\nAdoraria ver você contribuindo ou fazendo um fork para seu ambiente!\n",
      "color: #94a3b8; font-size: 12px; font-family: sans-serif;"
    );
    console.log(
      "%c🌐 UNIFICANDO:\nhttps://unificando.com.br\n",
      "color: #38bdf8; font-weight: bold; font-family: sans-serif;"
    );
    console.log(
      "%c🚀 GITHUB:\nhttps://github.com/renatojuniordw/radar-unificando\n",
      "color: #38bdf8; font-weight: bold; font-family: sans-serif;"
    );
    console.log(
      "%c👨‍💻 PORTFÓLIO:\nhttps://renatobezerra.com.br/\n",
      "color: #38bdf8; font-weight: bold; font-family: sans-serif;"
    );
    console.log("%c---", "color: #64748b;");
  }, []);

  return null;
}
