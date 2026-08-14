"use client";

import { memo } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { Search, ArrowRight } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";

interface JobSearchBarProps {
  variant: "hero" | "header";
  roleQueries: string[];
  onRoleQueriesChange: (roles: string[]) => void;
  companies?: string[];
  onCompaniesChange?: (companies: string[]) => void;
  onSubmit?: (e: React.FormEvent) => void;
  onStart?: () => void;
  running?: boolean;
  cooldown?: number;
  suggestedRoles?: readonly string[] | string[];
  suggestedCompanies?: readonly string[] | string[];
  onAddRole?: (role: string) => void;
  onAddCompany?: (company: string) => void;
}

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

const suggestionRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  overflowX: "auto",
  pb: 0.5,
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

export const JobSearchBar = memo(function JobSearchBar({
  variant,
  roleQueries,
  onRoleQueriesChange,
  companies = [],
  onCompaniesChange,
  onSubmit,
  onStart,
  running = false,
  cooldown = 0,
  suggestedRoles = [],
  suggestedCompanies = [],
  onAddRole,
  onAddCompany,
}: JobSearchBarProps) {
  const isHero = variant === "hero";

  const handleAddRole = (role: string) => {
    if (onAddRole) {
      onAddRole(role);
    } else if (!roleQueries.includes(role)) {
      onRoleQueriesChange([...roleQueries, role]);
    }
  };

  const handleAddCompany = (company: string) => {
    if (onAddCompany) {
      onAddCompany(company);
    } else if (onCompaniesChange && !companies.includes(company)) {
      onCompaniesChange([...companies, company]);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isHero && onSubmit) {
      onSubmit(e);
    } else if (!isHero && onStart) {
      onStart();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmitForm}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isHero ? 1.5 : 2.5,
        width: "100%",
      }}
    >
      {/* Container Principal de Busca */}
      <Box
        sx={{
          bgcolor: "#0f172a",
          border: isHero ? "3px solid #ccff00" : "2px solid #334155",
          boxShadow: isHero ? "8px 8px 0px #000" : "4px 4px 0px #000",
          p: isHero ? { xs: 1.5, sm: 2 } : 2,
          display: isHero ? "flex" : "grid",
          flexDirection: isHero ? { xs: "column", sm: "row" } : undefined,
          gridTemplateColumns: !isHero
            ? { xs: "1fr", md: "1fr 1fr auto" }
            : undefined,
          gap: 1.5,
          alignItems: "center",
          transition: "all 0.2s ease-in-out",
          "&:focus-within": isHero
            ? {
                borderColor: "#ffffff",
                boxShadow: "8px 8px 0px #ccff00",
              }
            : undefined,
        }}
      >
        {isHero ? (
          /* Modo Hero (Home): Campo Sem Borda Interna com Ícone de Lupa */
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                flex: 1,
                px: 1,
              }}
            >
              <Search size={22} className="text-[#ccff00] shrink-0" />
              <TagInput
                frameless
                showHelperHint={false}
                placeholder="Digite o cargo desejado (ex: React, DevOps, Python)..."
                value={roleQueries}
                onChange={onRoleQueriesChange}
                dark
              />
            </Box>

            <Button
              type="submit"
              disabled={running || cooldown > 0}
              variant="contained"
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                fontWeight: 900,
                fontSize: "0.9rem",
                fontFamily: "ui-monospace, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: 0,
                border: "2px solid #020617",
                boxShadow: "3px 3px 0px #000",
                height: 52,
                px: { xs: 3, sm: 4 },
                width: { xs: "100%", sm: "auto" },
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.25,
                shrink: 0,
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
              <span>BUSCAR VAGAS AGORA</span>
              <ArrowRight
                size={18}
                strokeWidth={3}
                className="shrink-0 text-[#020617]"
              />
            </Button>
          </>
        ) : (
          /* Modo Header (/busca): Grid com Dois Campos */
          <>
            <Box sx={{ width: "100%" }}>
              <TagInput
                label="CARGOS / PALAVRAS-CHAVE"
                helperText="Separe múltiplos termos com vírgula (,) ou Enter"
                value={roleQueries}
                onChange={onRoleQueriesChange}
                placeholder="Ex: Frontend, React, Python..."
                dark
                compact
                showHelperHint
              />
            </Box>

            {onCompaniesChange && (
              <Box sx={{ width: "100%" }}>
                <TagInput
                  label="EMPRESAS-ALVO"
                  value={companies}
                  onChange={onCompaniesChange}
                  placeholder="Ex: Nubank, Mercado Livre..."
                  dark
                  compact
                  showHelperHint
                />
              </Box>
            )}

            <Button
              type="submit"
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
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
          </>
        )}
      </Box>

      {/* Dica de Micro-copy para a Home Hero */}
      {isHero && (
        <Typography
          variant="caption"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            color: "#94a3b8",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            mt: -0.5,
            mb: 0.5,
          }}
        >
          💡 DICA: Separe múltiplos termos com vírgula (,) ou pressione Enter
          para pesquisar vários de uma vez.
        </Typography>
      )}

      {/* Sugestões de Cargos */}
      {suggestedRoles.length > 0 && (
        <Box sx={suggestionRowSx}>
          <Typography sx={suggestionLabelSx}>
            {isHero ? "POPULARES:" : "SUGESTÕES:"}
          </Typography>
          {suggestedRoles.map((role) => (
            <Chip
              key={role}
              label={`+ ${role}`}
              onClick={() => handleAddRole(role)}
              size="small"
              clickable
              sx={suggestionChipSx}
            />
          ))}
        </Box>
      )}

      {/* Sugestões de Empresas-Alvo */}
      {suggestedCompanies.length > 0 && (
        <Box sx={suggestionRowSx}>
          <Typography sx={suggestionLabelSx}>EMPRESAS-ALVO:</Typography>
          {suggestedCompanies.map((company) => (
            <Chip
              key={company}
              label={`+ ${company}`}
              onClick={() => handleAddCompany(company)}
              size="small"
              clickable
              sx={suggestionChipSx}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});
