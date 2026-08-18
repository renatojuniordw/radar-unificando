"use client";

import { memo, useCallback } from "react";
import { Container, Box, Typography, Chip, CircularProgress } from "@mui/material";
import { JobTable } from "@/components/job-table/job-table";
import { useSnackbar } from "@/hooks/useSnackbar";
import type { Job } from "@/lib/types/job";

interface ResultsSectionProps {
  recommendedMode: boolean;
  jobs: Job[];
  loading: boolean;
  autoSyncing?: boolean;
  roleCategories: string[];
  areaOrRole: string;
  onFilterChange: (filters?: {
    platform?: string;
    role?: string;
    search?: string;
  }) => void;
  canGenerateResume: boolean;
  onGenerateResume: (job: Job) => void;
  generatingJobKey: string | null;
  onAnalyzeAts: (job: Job) => void;
}

async function exportCsv(showSnackbar: (message: string, severity: "success" | "error") => void) {
  try {
    const res = await fetch("/export?format=csv");
    if (res.status === 401) {
      showSnackbar("Você precisa estar logado para exportar as vagas.", "error");
      return;
    }
    if (!res.ok) {
      showSnackbar("Erro ao exportar vagas. Tente novamente.", "error");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `radar-unificando-vagas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    showSnackbar("Erro ao exportar vagas. Tente novamente.", "error");
  }
}

export const ResultsSection = memo(function ResultsSection({
  recommendedMode,
  jobs,
  loading,
  autoSyncing,
  roleCategories,
  areaOrRole,
  onFilterChange,
  canGenerateResume,
  onGenerateResume,
  generatingJobKey,
  onAnalyzeAts,
}: ResultsSectionProps) {
  const { show: showSnackbar } = useSnackbar();

  const handleExportCsv = useCallback(async () => {
    await exportCsv(showSnackbar);
  }, [showSnackbar]);

  return (
    <Box className="section-white">
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: { xs: 2.5, md: 4 } }}>
          {recommendedMode && jobs.length > 0 && (
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  color: "#f8fafc",
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2.25rem" },
                  lineHeight: 1.15,
                  wordBreak: "break-word",
                }}
              >
                RECOMENDADAS PARA VOCÊ · <Box component="span" sx={{ color: "#ccff00" }}>{areaOrRole}</Box>
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={`${jobs.length} vagas encontradas`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${new Set(jobs.map((j) => j.company)).size} empresas`}
                  color="secondary"
                  size="small"
                />
              </Box>
            </Box>
          )}

          {autoSyncing && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.75,
                bgcolor: "#ccff00",
                color: "#020617",
                border: "2px solid #020617",
                boxShadow: "3px 3px 0px #020617",
                fontWeight: 800,
                fontSize: "0.8125rem",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                borderRadius: 0,
              }}
            >
              <CircularProgress size={14} thickness={6} sx={{ color: "#020617" }} />
              Atualizando vagas em segundo plano...
            </Box>
          )}
        </Box>

        <JobTable
          jobs={jobs}
          loading={loading}
          roleCategories={roleCategories}
          onExportCsv={handleExportCsv}
          onFilterChange={onFilterChange}
          canGenerateResume={canGenerateResume}
          onGenerateResume={onGenerateResume}
          generatingJobKey={generatingJobKey}
          onAnalyzeAts={onAnalyzeAts}
        />
      </Container>
    </Box>
  );
});
