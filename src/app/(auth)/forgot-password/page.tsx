"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { FormField } from "@/components/ui/form-field";
import { zodFieldErrors } from "@/lib/utils/form-errors";
import { KeyRound, ArrowLeft, MailCheck } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setApiError(data?.error || "Erro ao processar a solicitação");
        return;
      }

      setSent(true);
    } catch {
      setApiError("Erro ao processar a solicitação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      {/* Header section */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#ccff00",
            color: "#020617",
            border: "2px solid #020617",
            boxShadow: "3px 3px 0px #000",
            padding: "4px 10px",
            fontSize: "0.75rem",
            fontWeight: 900,
            fontFamily: "ui-monospace, monospace",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          <KeyRound size={14} />
          <span>RECUPERAR SENHA</span>
        </div>
        <h1
          style={{
            fontWeight: 900,
            fontSize: "2.2rem",
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
            margin: "0 0 6px",
            color: "#020617",
          }}
        >
          ESQUECEU A SENHA?
        </h1>
        <p
          style={{
            color: "#475569",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Informe seu email e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      {/* Main Card */}
      <div className="card-brutalist" style={{ padding: 24 }}>
        {sent ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <MailCheck size={28} color="#16a34a" />
              <h2
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "#16a34a",
                }}
              >
                EMAIL ENVIADO
              </h2>
            </div>
            <p
              style={{
                color: "#475569",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                margin: 0,
                textAlign: "center",
              }}
            >
              Se existir uma conta com este email, enviamos um link de
              recuperação.
            </p>
          </div>
        ) : (
          <>
            {apiError && (
              <div
                style={{
                  border: "2px solid #dc2626",
                  padding: 10,
                  marginBottom: 16,
                  backgroundColor: "#fef2f2",
                }}
              >
                <p
                  style={{
                    color: "#dc2626",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    fontFamily: "ui-monospace, monospace",
                    margin: 0,
                  }}
                >
                  ⚠️ {apiError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormField
                label="Email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={errors.email}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-neon"
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>{loading ? "ENVIANDO..." : "ENVIAR LINK"}</span>
              </button>
            </form>
          </>
        )}
      </div>

      {/* Bottom Login Link Callout */}
      <div
        style={{
          textAlign: "center",
          marginTop: 18,
          padding: "12px 16px",
          border: "3px solid #020617",
          backgroundColor: "#ffffff",
          boxShadow: "4px 4px 0px #000",
        }}
      >
        <Link
          href="/login"
          style={{
            color: "#020617",
            fontWeight: 900,
            textDecoration: "none",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={14} />
          VOLTAR AO LOGIN
        </Link>
      </div>
    </div>
  );
}
