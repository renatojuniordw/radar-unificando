"use client";

import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import { TagInput } from "@/components/tag-input";
import { RotatingText } from "@/components/home/rotating-text";
import { SUGGESTED_ROLES } from "@/lib/constants/home";

interface HeroSectionProps {
  isLoggedIn: boolean;
  minimalProfile: boolean;
  companies: string[];
  onCompaniesChange: (companies: string[]) => void;
  roleQueries: string[];
  onRoleQueriesChange: (roles: string[]) => void;
  cooldown: number;
  running: boolean;
  onStart: () => void;
  onAddSuggestion: (cargo: string) => void;
}

export function HeroSection({
  isLoggedIn,
  minimalProfile,
  companies,
  onCompaniesChange,
  roleQueries,
  onRoleQueriesChange,
  cooldown,
  running,
  onStart,
  onAddSuggestion,
}: HeroSectionProps) {
  return (
    <Box
      className="section-hero"
      sx={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        className="hero-radar"
        sx={{
          position: "absolute",
          inset: -200,
          background:
            "conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ maxWidth: 720 }}>
          <Box className="badge-neon" sx={{ mb: 2 }}>
            GUPY + INHIRE · GRÁTIS
          </Box>

          {isLoggedIn && !minimalProfile && (
            <Box
              sx={{
                mb: 3,
                p: 2.5,
                border: "2px solid #ccff00",
                bgcolor: "rgba(204, 255, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 0,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "#f8fafc" }}
              >
                Complete seu perfil para receber vagas recomendadas
              </Typography>
              <Link href="/perfil" style={{ textDecoration: "none" }}>
                <Box
                  sx={{
                    fontWeight: 900,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: "#ccff00",
                    border: "2px solid #ccff00",
                    px: 2,
                    py: 1,
                    display: "inline-block",
                    "&:hover": { bgcolor: "#ccff00", color: "#020617" },
                  }}
                >
                  COMPLETAR →
                </Box>
              </Link>
            </Box>
          )}

          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#ccff00",
              fontSize: {
                xs: "2.25rem",
                sm: "3.25rem",
                md: "3.75rem",
                lg: "4.25rem",
              },
              lineHeight: 0.95,
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            RADAR DE VAGAS
            <br />
            REMOTAS
          </Typography>

          <Typography
            component="h2"
            sx={{
              mb: 3.5,
              maxWidth: 640,
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              fontFamily: "var(--font-family-inter)",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            A plataforma inteligente que busca vagas de <RotatingText /> em
            tempo real no{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 700 }}>
              Gupy
            </Box>{" "}
            e{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 700 }}>
              InHire
            </Box>
            , calcula seu score de match e adapta seu currículo sob medida.
          </Typography>

          {/* Search Card Container (Opção 2: Container Unificado) */}
          <Box
            sx={{
              bgcolor: "#0f172a",
              border: "2px solid #334155",
              p: { xs: 2.5, sm: 3 },
              boxShadow: "6px 6px 0px #000",
              mb: 3.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                mb: 2.5,
                pb: 1.5,
                borderBottom: "1px solid #1e293b",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.7rem",
                  color: "#ccff00",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <span>⚡</span> PARÂMETROS DE BUSCA
              </Typography>

              <Typography
                sx={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Empresas e cargos opcionais — sem filtros, até 500 vagas
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2.5 }}>
              <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 } }}>
                <TagInput
                  label="Empresas (opcional)"
                  helperText="Enter ou vírgula para adicionar. Deixe vazio para buscar todas."
                  placeholder="Ambev, Nubank, BRQ..."
                  value={companies}
                  onChange={onCompaniesChange}
                  autoFocus
                  dark
                  compact
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 } }}>
                <TagInput
                  label="Cargos (opcional)"
                  helperText="Enter ou vírgula para adicionar. Ex: Analista de Dados, Data Analyst, Growth"
                  placeholder="Analista de Dados, Data Analyst, Growth..."
                  value={roleQueries}
                  onChange={onRoleQueriesChange}
                  dark
                  compact
                />
              </Box>
            </Box>

            {cooldown > 0 && (
              <Typography
                sx={{
                  display: "block",
                  mb: 2,
                  color: "#ccff00",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                ⏱ Limite de buscas atingido. Aguarde {Math.floor(cooldown / 60)}
                min {cooldown % 60}s.
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                width: "100%",
              }}
            >
              <button
                onClick={onStart}
                disabled={running || cooldown > 0}
                className="btn-neon"
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {running
                  ? "BUSCANDO VAGAS..."
                  : cooldown > 0
                    ? `AGUARDAR ${Math.floor(cooldown / 60)}min ${cooldown % 60}s`
                    : "BUSCAR VAGAS EM TEMPO REAL"}
              </button>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.2,
              flexWrap: "wrap",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.6rem",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Sugestões:
            </Typography>
            {SUGGESTED_ROLES.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => onAddSuggestion(s)}
                style={{
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  cursor: "pointer",
                  border: "1px solid #334155",
                  color: "#94a3b8",
                  background: "#0f172a",
                  padding: "4px 10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "ui-monospace, monospace",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ccff00";
                  e.currentTarget.style.color = "#ccff00";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {s}
              </button>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
