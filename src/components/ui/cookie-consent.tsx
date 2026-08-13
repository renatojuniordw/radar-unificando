"use client";

import { useEffect, useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { ANALYTICS, IMPACT } from "@/lib/core/constants";

const CONSENT_KEY = "cookie_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ANALYTICS.gaId;

/**
 * Script de tracking da Impact (afiliados). Antes vivia incondicionalmente no
 * layout.tsx via <Script afterInteractive>; agora só é injetado após o
 * consentimento de cookies (LGPD — relatório itens 3.2/3.3).
 */
function loadImpactScript() {
  // Re-consentimento (recusar e aceitar de novo) não deve duplicar o script.
  if (document.getElementById("impact-tracking")) return;
  const script = document.createElement("script");
  script.async = true;
  script.id = "impact-tracking";
  script.textContent = `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('${IMPACT.scriptUrl}','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`;
  document.body.appendChild(script);
}

type Consent = "accepted" | "declined" | null;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Consent {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === "accepted" || stored === "declined" ? stored : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): Consent {
  return null;
}

/**
 * Aviso de cookies (LGPD): o Google Analytics só é carregado após o
 * consentimento. Cookies essenciais (sessão do login) não dependem do aviso.
 */
export function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (consent === "accepted") loadImpactScript();
  }, [consent]);

  const choose = (value: Exclude<Consent, null>) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      // Notifica os listeners do useSyncExternalStore (mesma aba).
      window.dispatchEvent(new Event("storage"));
    } catch {
      // sem persistência → vale só para esta sessão
    }
  };

  return (
    <>
      {consent === "accepted" && <GoogleAnalytics gaId={GA_ID} />}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Aviso de cookies"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1400,
            backgroundColor: "#0f172a",
            borderTop: "4px solid #ccff00",
            boxShadow: "0 -6px 0 #000",
            padding: "16px 20px",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#cbd5e1",
                fontSize: "0.85rem",
                lineHeight: 1.55,
                maxWidth: 720,
                flex: "1 1 320px",
              }}
            >
              <strong style={{ color: "#ccff00" }}>🍪 AVISO DE COOKIES</strong>{" "}
              Usamos cookies essenciais para o funcionamento (ex.: sua sessão de
              login) e, com seu consentimento, o Google Analytics (para entender
              como o site é usado) e o tracking de afiliados da Impact (para
              recomendar cursos). Você pode aceitar ou recusar.{" "}
              <Link
                href="/termos#cookies"
                style={{ color: "#ccff00", textDecoration: "underline" }}
              >
                Saiba mais na Política de Cookies
              </Link>
              .
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => choose("declined")}
                style={{
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  border: "2px solid #334155",
                  padding: "10px 18px",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                style={{
                  backgroundColor: "#ccff00",
                  color: "#020617",
                  border: "2px solid #ccff00",
                  padding: "10px 18px",
                  fontWeight: 900,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  boxShadow: "4px 4px 0px #000",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}