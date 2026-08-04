"use client";

import { Container, Box, Typography, Chip, CircularProgress } from "@mui/material";
import { VagaTable } from "@/components/vaga-table";
import type { Vaga } from "@/lib/types/vaga";

interface ResultsSectionProps {
  modoRecomendado: boolean;
  vagas: Vaga[];
  loading: boolean;
  autoSyncing?: boolean;
  cargos: string[];
  areaOuCargo: string;
  onFilterChange: (filters?: {
    plataforma?: string;
    cargo?: string;
    search?: string;
  }) => void;
}

export function ResultsSection({
  modoRecomendado,
  vagas,
  loading,
  autoSyncing,
  cargos,
  areaOuCargo,
  onFilterChange,
}: ResultsSectionProps) {
  return (
    <Box className="section-white">
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: { xs: 2.5, md: 4 } }}>
          {modoRecomendado && vagas.length > 0 && (
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  color: "#020617",
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2.25rem" },
                  lineHeight: 1.15,
                  wordBreak: "break-word",
                }}
              >
                RECOMENDADAS PARA VOCÊ · {areaOuCargo}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={`${vagas.length} vagas encontradas`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${new Set(vagas.map((v) => v.empresa)).size} empresas`}
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

        <VagaTable
          vagas={vagas}
          loading={loading}
          cargos={cargos}
          onExportCsv={() => window.open("/export?format=csv", "_blank")}
          onFilterChange={onFilterChange}
        />
      </Container>
    </Box>
  );
}
