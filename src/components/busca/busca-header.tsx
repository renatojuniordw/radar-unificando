"use client";

import { memo } from "react";
import { Container, Box, Typography, Button, Chip } from "@mui/material";
import { TagInput } from "@/components/ui/tag-input";
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

// Estilo compartilhado dos chips de sugestão (cargos e empresas-alvo).
const suggestionChipSx = {
  bgcolor: "#1e293b",
  color: "#cbd5e1",
  border: "1px solid #334155",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.7rem",
  borderRadius: 0,
  shrink: 0,
  whiteSpace: "nowrap",
  transition: "all 0.15s",
  "&:active": { transform: "scale(0.95)" },
  "&:hover": {
    bgcolor: "#ccff00",
    color: "#020617",
    borderColor: "#ccff00",
    fontWeight: 800,
  },
} as const;

// Carrossel horizontal dos chips de sugestão.
const suggestionRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  overflowX: "auto",
  pb: 1,
  pt: 0.5,
  width: "100%",
  "::-webkit-scrollbar": { display: "none" },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
} as const;

const suggestionLabelSx = {
  fontSize: "0.7rem",
  fontFamily: "ui-monospace, monospace",
  fontWeight: 800,
  color: "#94a3b8",
  textTransform: "uppercase",
  mr: 0.5,
  shrink: 0,
  whitespace: "nowrap",
} as const;

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

          {/* Tag Inputs Row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
              gap: 2,
              alignItems: "flex-end",
              bgcolor: "#0f172a",
              border: "2px solid #334155",
              boxShadow: "4px 4px 0px #000",
              p: 2,
            }}
          >
            <Box>
              <TagInput
                label="🎯 CARGOS / PALAVRAS-CHAVE"
                value={roleQueries}
                onChange={onRoleQueriesChange}
                placeholder="Ex: Frontend, React, Python..."
                dark
                compact
              />
            </Box>

            <Box>
              <TagInput
                label="🏢 EMPRESAS-ALVO"
                value={companies}
                onChange={onCompaniesChange}
                placeholder="Ex: Nubank, Mercado Livre..."
                dark
                compact
              />
            </Box>

            <Button
              onClick={onStart}
              disabled={running || cooldown > 0}
              variant="contained"
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                fontWeight: 900,
                fontSize: "0.875rem",
                fontFamily: "ui-monospace, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: 0,
                border: "2px solid #020617",
                boxShadow: "3px 3px 0px #000",
                height: 56,
                px: 3,
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "#b3e600",
                  boxShadow: "1px 1px 0px #000",
                },
                "&:disabled": {
                  bgcolor: "#334155",
                  color: "#94a3b8",
                },
              }}
            >
              {running ? "BUSCANDO..." : "BUSCAR VAGAS"}
            </Button>
          </Box>


          {/* Quick Suggestions Chips Carousel — Cargos */}
          <Box sx={suggestionRowSx}>
            <Typography sx={suggestionLabelSx}>SUGESTÕES:</Typography>
            {SUGGESTED_ROLES.map((role) => (
              <Chip
                key={role}
                label={`+ ${role}`}
                onClick={() => onAddSuggestion(role)}
                size="small"
                clickable
                sx={suggestionChipSx}
              />
            ))}
          </Box>

          {/* Quick Suggestions Chips Carousel — Empresas-alvo */}
          <Box sx={suggestionRowSx}>
            <Typography sx={suggestionLabelSx}>EMPRESAS-ALVO:</Typography>
            {SUGGESTED_COMPANIES.map((company) => (
              <Chip
                key={company}
                label={`+ ${company}`}
                onClick={() => onAddCompany(company)}
                size="small"
                clickable
                sx={suggestionChipSx}
              />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
});
