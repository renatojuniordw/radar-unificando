"use client";

import { Box, Typography } from "@mui/material";
import { CheckCircle, ErrorOutline, InfoOutlined } from "@mui/icons-material";
import type { AtsResult } from "@/lib/core/ai/ats/ats-analyzer";
import { tokens } from "@/lib/infrastructure/ui/tokens";

export function scoreColor(score: number): string {
  if (score < 50) return "#ef4444";
  if (score < 75) return "#f59e0b";
  return "#22c55e";
}

export function scoreLabel(score: number): string {
  if (score < 50) return "Precisa melhorar";
  if (score < 75) return "Bom";
  return "Ótimo";
}

interface Props {
  result: AtsResult;
}

export function AtsResultsContent({ result }: Props) {
  return (
    <>
      {/* Score */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            border: `6px solid ${scoreColor(result.analysis.score)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "1.6rem",
              color: scoreColor(result.analysis.score),
            }}
          >
            {result.analysis.score}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>
            {scoreLabel(result.analysis.score)}
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
            {result.cached
              ? "Resultado em cache (currículo já analisado)."
              : "Score de compatibilidade ATS (0-100)."}
          </Typography>
        </Box>
      </Box>

      {result.analysis.summary && (
        <Typography sx={{ color: "#e2e8f0", fontSize: "0.85rem", mb: 2 }}>
          {result.analysis.summary}
        </Typography>
      )}

      {/* Checklist rápido */}
      <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: tokens.accent, mb: 1 }}>
        Checklist rápido
      </Typography>
      <Box sx={{ mb: 2 }}>
        {result.heuristics.checks.map((c) => (
          <Box key={c.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
            {c.ok ? (
              <CheckCircle sx={{ fontSize: 16, color: "#22c55e", mt: 0.3 }} />
            ) : (
              <ErrorOutline sx={{ fontSize: 16, color: "#f59e0b", mt: 0.3 }} />
            )}
            <Typography sx={{ color: "#e2e8f0", fontSize: "0.8rem" }}>
              <strong>{c.label}:</strong> {c.detail}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Palavras-chave faltando */}
      {result.analysis.missingKeywords.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: tokens.accent, mb: 1 }}>
            Palavras-chave faltando
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {result.analysis.missingKeywords.map((k) => (
              <Box
                key={k}
                sx={{
                  bgcolor: "#1e293b",
                  border: "1px solid #f59e0b",
                  color: "#fbbf24",
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {k}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Recomendações */}
      {result.analysis.recommendations.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: tokens.accent, mb: 1 }}>
            Recomendações
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#e2e8f0", fontSize: "0.8rem" }}>
            {result.analysis.recommendations.map((r, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {r}
              </li>
            ))}
          </ul>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 2, color: tokens.muted }}>
        <InfoOutlined sx={{ fontSize: 16, mt: 0.2 }} />
        <Typography sx={{ fontSize: "0.7rem" }}>
          Avaliação baseada em boas práticas de ATS — não é garantia de passar em nenhum sistema específico.
        </Typography>
      </Box>
    </>
  );
}
