"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import { AutoAwesome, AccessTime } from "@mui/icons-material";
import type { AtsResult } from "@/lib/core/ai/ats/ats-analyzer";
import { downloadAdaptedResume, downloadAdaptedResumeDocx, type ResumeProgressStep } from "@/lib/client/resume-download";
import { AtsResultsContent } from "./ats-results-content";

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

type Stage = "loading" | "ready" | "error" | "rate-limited";

// Servidor pode levar até ~70-75s no pior caso (2 tentativas de 35s em
// ats-analyzer.ts::GENERATE_TIMEOUT_MS + overhead). O timeout do cliente
// precisa ficar acima disso, senão abortamos bem quando o servidor está
// prestes a responder com sucesso.
const FETCH_TIMEOUT_MS = 90_000;

/** Formata segundos como "Xh Ymin" / "Xmin Ys" / "Xs" conforme a magnitude. */
function formatRetryTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export function AtsAnalysisDrawer({ open, job, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [initialRetryAfter, setInitialRetryAfter] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [resumeProgress, setResumeProgress] = useState<ResumeProgressStep | null>(null);
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
        if (res.status === 429 && data?.code === "RATE_LIMITED" && typeof data?.retryAfter === "number") {
          setRetryAfter(data.retryAfter);
          setInitialRetryAfter(data.retryAfter);
          setStage("rate-limited");
          return;
        }
        setError(data?.error || "Erro ao analisar o currículo.");
        setStage("error");
        return;
      }
      setResult(data as AtsResult);
      setStage("ready");
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setError(
        isTimeout
          ? "A análise está demorando mais que o esperado. Tente novamente em instantes."
          : "Erro de conexão. Tente novamente.",
      );
      setStage("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // Contagem regressiva do rate limit — mesmo padrão do cooldown de busca em useJobSearch.
  useEffect(() => {
    if (stage !== "rate-limited" || retryAfter <= 0) return;
    const id = setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [stage, retryAfter]);

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
    setResumeProgress({
      step: 1,
      totalSteps: 3,
      message: "Analisando requisitos da vaga e palavras-chave ATS...",
      progressPercent: 20,
    });
    try {
      await downloadAdaptedResume(
        {
          title: job.title,
          company: job.company || "",
          description: job.description,
        },
        (stepInfo) => setResumeProgress(stepInfo),
      );
      setSnackbar("Currículo adaptado baixado!");
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : "Erro ao gerar o currículo.");
    } finally {
      setGenerating(false);
      setResumeProgress(null);
    }
  };

  const handleGenerateResumeDocx = async () => {
    if (!job || generating) return;
    setGenerating(true);
    setResumeProgress({
      step: 1,
      totalSteps: 3,
      message: "Analisando requisitos da vaga e palavras-chave ATS...",
      progressPercent: 20,
    });
    try {
      await downloadAdaptedResumeDocx(
        {
          title: job.title,
          company: job.company || "",
          description: job.description,
        },
        (stepInfo) => setResumeProgress(stepInfo),
      );
      setSnackbar("Currículo Word (DOCX) baixado!");
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : "Erro ao gerar o currículo.");
    } finally {
      setGenerating(false);
      setResumeProgress(null);
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

        {stage === "rate-limited" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 1.5,
              py: 4,
              px: 2,
              bgcolor: "#1e293b",
              border: "1px solid #f59e0b",
              borderRadius: 1,
            }}
          >
            <AccessTime sx={{ fontSize: 32, color: "#f59e0b" }} />
            <Box role="status">
              <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>
                Limite diário atingido
              </Typography>
              <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem", mt: 0.5 }}>
                Você já usou suas análises ATS de hoje. Tente novamente em aproximadamente{" "}
                {formatRetryTime(initialRetryAfter)}.
              </Typography>
            </Box>
            <Typography
              aria-hidden="true"
              sx={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: retryAfter > 0 ? "#f59e0b" : "#22c55e",
                mt: 1,
              }}
            >
              {retryAfter > 0 ? formatRetryTime(retryAfter) : "Disponível agora"}
            </Typography>
          </Box>
        )}

        {stage === "ready" && result && (
          <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <AtsResultsContent result={result} />
          </Box>
        )}

        {generating && resumeProgress && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "#1e293b",
              border: "1px solid #ccff00",
              borderRadius: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  color: "#ccff00",
                  fontFamily: "ui-monospace, monospace",
                  textTransform: "uppercase",
                }}
              >
                CONFECCIONANDO CURRÍCULO ({resumeProgress.step}/{resumeProgress.totalSteps})
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
                {resumeProgress.progressPercent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={resumeProgress.progressPercent}
              sx={{
                height: 6,
                bgcolor: "#0f172a",
                "& .MuiLinearProgress-bar": { bgcolor: "#ccff00" },
              }}
            />
            <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1", fontFamily: "ui-monospace, monospace" }}>
              {resumeProgress.message}
            </Typography>
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
          {stage === "rate-limited" && job && (
            <Button
              variant="contained"
              onClick={() => void analyze(job)}
              disabled={retryAfter > 0}
              aria-disabled={retryAfter > 0}
              aria-label={
                retryAfter > 0
                  ? `Tentar novamente disponível em ${formatRetryTime(retryAfter)}`
                  : "Tentar novamente"
              }
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                fontWeight: 900,
                "&:hover": { bgcolor: "#b8e600" },
                "&.Mui-disabled": { bgcolor: "#334155", color: "#64748b" },
              }}
            >
              {retryAfter > 0 ? `DISPONÍVEL EM ${formatRetryTime(retryAfter).toUpperCase()}` : "TENTAR NOVAMENTE"}
            </Button>
          )}
          {stage === "ready" && job && (
            <>
              <Button
                variant="contained"
                onClick={handleGenerateResume}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={14} sx={{ color: "#020617" }} /> : <AutoAwesome />}
                sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, "&:hover": { bgcolor: "#b8e600" } }}
              >
                {generating ? "GERANDO..." : "BAIXAR PDF"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleGenerateResumeDocx}
                disabled={generating}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#020617",
                  fontWeight: 900,
                  border: "2px solid #020617",
                  "&:hover": { bgcolor: "#f8fafc" },
                  "&.Mui-disabled": { bgcolor: "#334155", color: "#64748b" },
                }}
              >
                BAIXAR DOCX
              </Button>
            </>
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