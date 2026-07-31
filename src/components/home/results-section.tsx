"use client";

import { Container, Box, Typography, Chip } from "@mui/material";
import { VagaTable } from "@/components/vaga-table";
import type { Vaga } from "@/lib/types/vaga";

interface ResultsSectionProps {
  modoRecomendado: boolean;
  vagas: Vaga[];
  loading: boolean;
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
  cargos,
  areaOuCargo,
  onFilterChange,
}: ResultsSectionProps) {
  return (
    <Box className="section-white">
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {modoRecomendado && vagas.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                color: "#020617",
              }}
            >
              RECOMENDADAS PARA VOCÊ · {areaOuCargo}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Chip
                label={`${vagas.length} vagas encontradas`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${vagas.filter((v) => v.na_lista === "Sim").length} na sua lista`}
                color="warning"
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
