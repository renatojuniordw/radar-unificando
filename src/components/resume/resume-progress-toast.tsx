"use client";

import { Box, Typography, LinearProgress, IconButton } from "@mui/material";
import { Close, AutoAwesome, CheckCircle, ErrorOutline } from "@mui/icons-material";

export interface ResumeProgressState {
  jobTitle: string;
  jobCompany: string;
  step: number;
  totalSteps: number;
  message: string;
  progressPercent: number;
  status: "generating" | "success" | "error";
  errorMessage?: string;
}

interface Props {
  state: ResumeProgressState | null;
  onClose: () => void;
}

export function ResumeProgressToast({ state, onClose }: Props) {
  if (!state) return null;

  const isSuccess = state.status === "success";
  const isError = state.status === "error";

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 9999,
        width: { xs: "calc(100vw - 32px)", sm: 420 },
        bgcolor: "#020617",
        border: "3px solid #ccff00",
        boxShadow: "6px 6px 0px #000000",
        p: 2,
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        animation: "fadeInUp 0.3s ease-out",
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {isSuccess ? (
            <CheckCircle sx={{ color: "#22c55e", fontSize: 20 }} />
          ) : isError ? (
            <ErrorOutline sx={{ color: "#ef4444", fontSize: 20 }} />
          ) : (
            <AutoAwesome sx={{ color: "#ccff00", fontSize: 20, animation: "spin 3s linear infinite", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />
          )}
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: isSuccess ? "#22c55e" : isError ? "#ef4444" : "#ccff00",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {isSuccess
              ? "CURRÍCULO CONFECCIONADO!"
              : isError
              ? "ERRO NA GERAÇÃO"
              : `CONFECCIONANDO CURRÍCULO (${state.step}/${state.totalSteps})`}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "#94a3b8", p: 0.25, "&:hover": { color: "#fff" } }}
          aria-label="Fechar notificação"
        >
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Target Job Info */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.85rem",
          color: "#f8fafc",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {state.jobTitle}
        {state.jobCompany ? ` — ${state.jobCompany}` : ""}
      </Typography>

      {/* Progress Bar or Message */}
      {!isSuccess && !isError && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={state.progressPercent}
            sx={{
              height: 6,
              bgcolor: "#1e293b",
              border: "1px solid #334155",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#ccff00",
                transition: "transform 0.4s ease",
              },
            }}
          />
        </Box>
      )}

      {/* Detail Message */}
      <Typography
        sx={{
          fontSize: "0.75rem",
          color: isError ? "#f87171" : "#94a3b8",
          fontFamily: "ui-monospace, monospace",
          lineHeight: 1.4,
        }}
      >
        {isError
          ? state.errorMessage || "Ocorreu um erro ao confeccionar o currículo."
          : isSuccess
          ? "O download do PDF foi iniciado e salvo no seu computador!"
          : state.message}
      </Typography>
    </Box>
  );
}
