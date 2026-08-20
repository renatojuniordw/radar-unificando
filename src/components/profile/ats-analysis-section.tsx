"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorOutline } from "@mui/icons-material";
import type { AtsResult } from "@/lib/core/ai/ats/ats-analyzer";
import { AtsResultsContent } from "@/components/ats/ats-results-content";
import { tokens } from "@/lib/infrastructure/ui/tokens";

// Mantido em sincronia com FETCH_TIMEOUT_MS de ats-analysis-drawer.tsx.
const FETCH_TIMEOUT_MS = 90_000;

export function AtsAnalysisSection() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          jobDescription: jobDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erro ao analisar o currículo.");
        return;
      }
      setResult(await res.json());
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setError(
        isTimeout
          ? "A análise está demorando mais que o esperado. Tente novamente em instantes."
          : "Erro de conexão. Tente novamente.",
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        mt: 3,
        mb: 3,
        p: 3,
        border: "4px solid #ccff00",
        boxShadow: "6px 6px 0px #ccff00",
        bgcolor: tokens.primary,
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: "1rem",
          textTransform: "uppercase",
          color: tokens.accent,
          mb: 1,
          fontFamily: tokens.fontMono,
        }}
      >
        ANÁLISE ATS DO CURRÍCULO
      </Typography>
      <Typography sx={{ color: "#cbd5e1", fontSize: "0.8rem", mb: 2, fontFamily: tokens.fontMono }}>
        Descubra se seu currículo passa nos filtros automáticos (ATS) usados
        pelas empresas. Opcional: cole a descrição da vaga para checar as
        palavras-chave que faltam.
      </Typography>

      <TextField
        label="Descrição da vaga (opcional)"
        multiline
        minRows={2}
        maxRows={5}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        fullWidth
        size="small"
        placeholder="Cole aqui a descrição da vaga alvo..."
        sx={{
          mb: 2,
          "& .MuiInputBase-root": { color: "#fff", fontFamily: tokens.fontMono, fontSize: "0.8rem" },
          "& .MuiInputLabel-root": { color: "#94a3b8", fontFamily: tokens.fontMono },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#334155" },
        }}
      />

      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={loading}
        aria-busy={loading}
        startIcon={
          loading ? <CircularProgress size={16} color="inherit" /> : undefined
        }
        sx={{
          bgcolor: tokens.accent,
          color: tokens.primary,
          fontWeight: 900,
          textTransform: "uppercase",
          fontSize: "0.75rem",
          fontFamily: tokens.fontMono,
          border: tokens.border,
          "&:hover": { bgcolor: tokens.accentHover },
          "&.Mui-disabled": { bgcolor: "grey.600", color: "grey.400" },
        }}
      >
        {loading ? "Analisando..." : "ANALISAR COMPATIBILIDADE ATS"}
      </Button>

      {error && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 2,
            color: "#f87171",
          }}
        >
          <ErrorOutline sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: "0.8rem" }}>{error}</Typography>
        </Box>
      )}

      {result && (
        <Box sx={{ mt: 3 }}>
          <AtsResultsContent result={result} />
        </Box>
      )}
    </Box>
  );
}
