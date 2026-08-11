"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ContentCopy, Download, Check } from "@mui/icons-material";
import type { Job } from "@/lib/types/job";
import type { AdaptedResume } from "@/lib/core/ai/resume-adaptation-generator";

interface GenerateResponse {
  resume: AdaptedResume;
  resumeMarkdown: string;
  pdfBase64: string;
}

interface Props {
  open: boolean;
  job: Job | null;
  onClose: () => void;
}

type Stage = "generating" | "ready" | "error";

const FETCH_TIMEOUT_MS = 120_000;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadPdf(pdfBase64: string, filename: string) {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontFamily: "ui-monospace, monospace",
        fontWeight: 900,
        color: "#ccff00",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        mt: 2,
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

function ResumePreview({ resume }: { resume: AdaptedResume }) {
  const contactParts = [
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    resume.contact?.linkedin,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        bgcolor: "#0f172a",
        border: "3px solid #020617",
        p: 2.5,
        maxHeight: 420,
        overflowY: "auto",
      }}
    >
      {resume.fullName && (
        <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color: "#f8fafc", mb: 0.5 }}>
          {resume.fullName}
        </Typography>
      )}
      {resume.headline && (
        <Typography sx={{ fontSize: "0.85rem", color: "#94a3b8", mb: 0.5 }}>
          {resume.headline}
        </Typography>
      )}
      {contactParts.length > 0 && (
        <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.5 }}>
          {contactParts.join(" · ")}
        </Typography>
      )}

      {resume.summary && (
        <>
          <SectionTitle>Resumo</SectionTitle>
          <Typography sx={{ fontSize: "0.8rem", color: "#e2e8f0" }}>
            {resume.summary}
          </Typography>
        </>
      )}

      {resume.skills.length > 0 && (
        <>
          <SectionTitle>Habilidades</SectionTitle>
          <Typography sx={{ fontSize: "0.8rem", color: "#e2e8f0" }}>
            {resume.skills.join(", ")}
          </Typography>
        </>
      )}

      {resume.experience.length > 0 && (
        <>
          <SectionTitle>Experiência</SectionTitle>
          {resume.experience.map((exp, i) => (
            <Box key={`exp-${i}`} sx={{ mb: 1.25 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#f8fafc" }}>
                {[exp.role, exp.company].filter(Boolean).join(" — ")}
                {exp.period ? ` (${exp.period})` : ""}
              </Typography>
              {exp.bullets.map((bullet, j) => (
                <Typography
                  key={`b-${j}`}
                  sx={{ fontSize: "0.75rem", color: "#cbd5e1", pl: 1, mt: 0.25 }}
                >
                  • {bullet}
                </Typography>
              ))}
            </Box>
          ))}
        </>
      )}

      {resume.education.length > 0 && (
        <>
          <SectionTitle>Formação</SectionTitle>
          {resume.education.map((edu, i) => (
            <Typography key={`edu-${i}`} sx={{ fontSize: "0.8rem", color: "#e2e8f0", mb: 0.5 }}>
              {[edu.degree, edu.institution, edu.period].filter(Boolean).join(" — ")}
            </Typography>
          ))}
        </>
      )}

      {resume.certifications.length > 0 && (
        <>
          <SectionTitle>Certificações</SectionTitle>
          {resume.certifications.map((cert, i) => (
            <Typography key={`cert-${i}`} sx={{ fontSize: "0.8rem", color: "#e2e8f0", mb: 0.5 }}>
              {[cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ")}
            </Typography>
          ))}
        </>
      )}

      {resume.languages.length > 0 && (
        <>
          <SectionTitle>Idiomas</SectionTitle>
          {resume.languages.map((lang, i) => (
            <Typography key={`lang-${i}`} sx={{ fontSize: "0.8rem", color: "#e2e8f0", mb: 0.25 }}>
              {[lang.language, lang.level].filter(Boolean).join(" — ")}
            </Typography>
          ))}
        </>
      )}
    </Box>
  );
}

export function ResumeGenerationModal({ open, job, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("generating");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (target: Job) => {
      setStage("generating");
      setResult(null);
      setError("");
      setCopied(false);

      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch("/api/resume/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            jobTitle: target.title,
            jobDescription: target.description || "",
            jobCompany: target.company,
            jobLocation: target.location,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Erro ao gerar o currículo.");
          setStage("error");
          return;
        }
        setResult(data as GenerateResponse);
        setStage("ready");
      } catch {
        setError("Erro de conexão. Tente novamente.");
        setStage("error");
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || !job) return;
    // Adia para fora do corpo do effect (evita setState síncrono no effect).
    const timer = setTimeout(() => void generate(job), 0);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [open, job, generate]);

  const handleDownload = () => {
    if (!result || !job) return;
    const filename = `curriculo-${slugify(job.title)}-${slugify(job.company)}.pdf`;
    downloadPdf(result.pdfBase64, filename);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.resumeMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", fontSize: "0.9rem" }}>
        {job ? `Currículo adaptado — ${job.title}` : "Currículo adaptado"}
      </DialogTitle>
      <DialogContent dividers>
        {stage === "generating" && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6 }}>
            <CircularProgress sx={{ color: "#ccff00" }} />
            <Typography sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", color: "#64748b" }}>
              GERANDO CURRÍCULO ADAPTADO...
            </Typography>
          </Box>
        )}

        {stage === "error" && (
          <Box sx={{ py: 2 }}>
            <Alert severity="error" variant="filled">
              {error}
            </Alert>
          </Box>
        )}

        {stage === "ready" && result && <ResumePreview resume={result.resume} />}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: "#64748b" }}>
          Fechar
        </Button>
        {stage === "error" && job && (
          <Button
            variant="contained"
            onClick={() => void generate(job)}
            sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, "&:hover": { bgcolor: "#b8e600" } }}
          >
            TENTAR NOVAMENTE
          </Button>
        )}
        {stage === "ready" && (
          <>
            <Button
              onClick={handleCopy}
              startIcon={copied ? <Check /> : <ContentCopy />}
              sx={{ color: "#64748b" }}
            >
              {copied ? "COPIADO" : "COPIAR MARKDOWN"}
            </Button>
            <Button
              variant="contained"
              onClick={handleDownload}
              startIcon={<Download />}
              sx={{ bgcolor: "#ccff00", color: "#020617", fontWeight: 900, "&:hover": { bgcolor: "#b8e600" } }}
            >
              BAIXAR PDF
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}