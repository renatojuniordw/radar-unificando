"use client";

import { useState } from "react";

const CONSENT_KEY = "cookie_consent";

/**
 * Link do rodapé que reabre o aviso de cookies (revogação/gestão do
 * consentimento) limpando a preferência salva.
 */
export function CookieSettingsLink() {
  const [label, setLabel] = useState("COOKIES");

  const openSettings = () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // sem persistência → nada a limpar
    }
    setLabel("AVISO EXIBIDO ✓");
    window.setTimeout(() => setLabel("COOKIES"), 2500);
  };

  return (
    <button
      type="button"
      onClick={openSettings}
      style={{
        background: "none",
        border: "none",
        color: "#94a3b8",
        fontSize: "0.65rem",
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontFamily: "ui-monospace, monospace",
        cursor: "pointer",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ccff00";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#94a3b8";
      }}
    >
      {label}
    </button>
  );
}