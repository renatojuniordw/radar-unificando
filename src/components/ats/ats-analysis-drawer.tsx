"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import { CheckCircle, ErrorOutline, InfoOutlined, AutoAwesome } from "@mui/icons-material";
import type { AtsHeuristic } from "@/lib/core/ai/ats/ats-heuristics";
import type { AtsAnalysis } from "@/lib/core/ai/ats/ats-analyzer";
import { downloadAdaptedResume } from "@/lib/client/resume-download";

interface AtsResult {
  heuristics: AtsHeuristic;
  analysis: AtsAnalysis;
  cached: boolean;
}

/** Shape mínimo de vaga aceito pelo drawer (Job da busca ou ParsedJob do chat). */
export interface AtsDrawerJob {
  id?: string;
  title: string;
  company?: string;
  description?: string;
}

interface Props {
  open: boolean;
  job: AtsDrawerJob | null;
  onClose: () => void;
}

type Stage = "loading" | "ready" | "error";

const FETCH_TIMEOUT_MS = 60_000;

function scoreColor(score: number): string {
  if (score < 50) return "#ef4444";
  if (score < 75) return "#f59e0b";
  return "#22c55e";
}

function scoreLabel(score: number): string {
  if (score < 50) return "Precisa melhorar";
  if (score < 75) return "Bom";
  return "Ótimo";
}

export function AtsAnalysisDrawer({ open, job, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (target: AtsDrawerJob) => {
    setStage("loading");
    setResult(null);
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          jobDescription: target.description || undefined,
          jobKey: target.id || `${target.title}|${target.company || ""}`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Erro ao analisar o currículo.");
        setStage("error");
        return;
      }
      setResult(data as AtsResult);
      setStage("ready");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStage("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!open || !job) return;
    // Adia para fora do corpo do effect (evita setState síncrono no effect).
    const timer = setTimeout(() => void analyze(job), 0);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [open, job, analyze]);

  const handleGenerateResume = async () => {
    if (!job || generating) return;
    setGenerating(true);
    try {
      await downloadAdaptedResume({
        title: job.title,
        company: job.company || "",
        description: job.description,
      });
      setSnackbar("Currículo adaptado baixado!");
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : "Erro ao gerar o currículo.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520 },
          bgcolor: "#0f172a",
          borderLeft: "3px solid #020617",
        },
      }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: "0.85rem",
            color: "#ccff00",
            letterSpacing: "0.05em",
            mb: 0.5,
          }}
        >
          Análise ATS
        </Typography>
        {job && (
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#f8fafc", mb: 2 }}>
            {job.title}
            {job.company ? ` — ${job.company}` : ""}
          </Typography>
        )}

        {stage === "loading" && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 8 }}>
            <CircularProgress sx={{ color: "#ccff00" }} />
            <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", color: "#64748b" }}>
              ANALISANDO COMPATIBILIDADE ATS...
            </Typography>
          </Box>
        )}

        {stage === "error" && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}

        {stage === "ready" && result && (
          <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
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
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: "#ccff00", mb: 1 }}>
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
                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: "#ccff00", mb: 1 }}>
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
                <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", color: "#ccff00", mb: 1 }}>
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

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 2, color: "#64748b" }}>
              <InfoOutlined sx={{ fontSize: 16, mt: 0.2 }} />
              <Typography sx={{ fontSize: "0.7rem" }}>
                Avaliação baseada em boas práticas de ATS — não é garantia de passar em nenhum sistema específico.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Rodapé fixo */}
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #1e293b", display: "flex", gap: 1 }}>
          <Button onClick={onClose} sx={{ color: "#64748b" }}>
            Fechar
          </Button>
          {stage === "error" && job && (
            <Button
              variant="contained"
              onClick={() => void analyze(job)}
              sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, "&:hover": { bgcolor: "#b8e600" } }}
            >
              TENTAR NOVAMENTE
            </Button>
          )}
          {stage === "ready" && job && (
            <Button
              variant="contained"
              onClick={handleGenerateResume}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={14} sx={{ color: "#020617" }} /> : <AutoAwesome />}
              sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, "&:hover": { bgcolor: "#b8e600" } }}
            >
              {generating ? "GERANDO..." : "GERAR CURRÍCULO ADAPTADO"}
            </Button>
          )}
        </Box>
      </Box>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.includes("baixado") ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbar("")}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}