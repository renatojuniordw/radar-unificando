"use client";

import { memo } from "react";
import { Container, Box, Typography, Chip } from "@mui/material";
import { JobSearchBar } from "@/components/shared/job-search-bar";
import { SUGGESTED_COMPANIES, SUGGESTED_ROLES } from "@/lib/constants/home";

interface BuscaHeaderProps {
  companies: string[];
  onCompaniesChange: (companies: string[]) => void;
  roleQueries: string[];
  onRoleQueriesChange: (roles: string[]) => void;
  cooldown: number;
  running: boolean;
  onStart: () => void;
  onAddSuggestion: (role: string) => void;
  onAddCompany: (company: string) => void;
}

export const BuscaHeader = memo(function BuscaHeader({
  companies,
  onCompaniesChange,
  roleQueries,
  onRoleQueriesChange,
  cooldown,
  running,
  onStart,
  onAddSuggestion,
  onAddCompany,
}: BuscaHeaderProps) {
  return (
    <Box
      className="section-hero"
      sx={{
        bgcolor: "#020617",
        borderBottom: "2px solid #1e293b",
        pt: { xs: 3, md: 4 },
        pb: { xs: 3, md: 4 },
        position: "relative",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Header Title & Status */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#ccff00",
                  color: "#020617",
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  fontFamily: "ui-monospace, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  boxShadow: "2px 2px 0px #000",
                }}
              >
                VAGAS & CURSOS
              </Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.75rem" },
                  fontWeight: 900,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                }}
              >
                CENTRAL DE BUSCA E CAPACITAÇÃO
              </Typography>
            </Box>

            {cooldown > 0 && (
              <Chip
                label={`Aguarde ${cooldown}s para nova busca`}
                size="small"
                sx={{
                  bgcolor: "#1e293b",
                  color: "#ccff00",
                  border: "1px solid #ccff00",
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Box>

          {/* Componente Unificado de Busca por Tags */}
          <JobSearchBar
            variant="header"
            roleQueries={roleQueries}
            onRoleQueriesChange={onRoleQueriesChange}
            companies={companies}
            onCompaniesChange={onCompaniesChange}
            onStart={onStart}
            running={running}
            cooldown={cooldown}
            suggestedRoles={SUGGESTED_ROLES}
            suggestedCompanies={SUGGESTED_COMPANIES}
            onAddRole={onAddSuggestion}
            onAddCompany={onAddCompany}
          />
        </Box>
      </Container>
    </Box>
  );
});

