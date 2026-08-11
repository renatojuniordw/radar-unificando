"use client";

import { memo, useCallback } from "react";
import { Container, Box, Typography, Chip, CircularProgress } from "@mui/material";
import { JobTable } from "@/components/job-table/job-table";
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
}: ResultsSectionProps) {
  const handleExportCsv = useCallback(() => {
    window.open("/export?format=csv", "_blank");
  }, []);

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
        />
      </Container>
    </Box>
  );
});
