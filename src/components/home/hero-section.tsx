"use client";

import { Container, Box, Typography, Grid } from "@mui/material";
import Link from "next/link";
import { CompanyInput } from "@/components/company-input";
import { CargoInput } from "@/components/cargo-input";
import { RotatingText } from "@/components/home/rotating-text";
import { SUGGESTED_CARGOS } from "@/lib/constants/home";

interface HeroSectionProps {
  isLoggedIn: boolean;
  primeiroNome: string;
  perfilCompleto: boolean;
  empresas: string[];
  onEmpresasChange: (empresas: string[]) => void;
  cargosBusca: string[];
  onCargosBuscaChange: (cargos: string[]) => void;
  cooldown: number;
  running: boolean;
  onStart: () => void;
  onAddSuggestion: (cargo: string) => void;
}

export function HeroSection({
  isLoggedIn,
  primeiroNome,
  perfilCompleto,
  empresas,
  onEmpresasChange,
  cargosBusca,
  onCargosBuscaChange,
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
        sx={{ py: { xs: 5, md: 8 }, position: "relative", zIndex: 1 }}
      >
        <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
          {/* Coluna 1: Conteúdo Principal e Busca */}
          <Grid size={{ xs: 12, md: 7, lg: 7 }}>
            <Box className="badge-neon" sx={{ mb: 2 }}>
              GUPY + INHIRE · GRÁTIS
            </Box>



            {isLoggedIn && !perfilCompleto && (
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

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                mb: 2,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  border: "2px solid #334155",
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <span style={{ fontSize: "0.6rem", lineHeight: 1 }}>⚡</span>
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "ui-monospace, monospace",
                    lineHeight: 1,
                  }}
                >
                  Sem filtros: até 500 vagas aleatórias
                </span>
              </Box>
            </Box>

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

            <Typography
              sx={{
                mb: 1.5,
                color: "#64748b",
                fontWeight: 700,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Empresas e cargos são opcionais — deixe em branco pra buscar tudo.
              Enter ou vírgula para adicionar.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3.5 }}>
              <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 } }}>
                <CompanyInput
                  value={empresas}
                  onChange={onEmpresasChange}
                  autoFocus
                  dark
                  compact
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 } }}>
                <CargoInput
                  value={cargosBusca}
                  onChange={onCargosBuscaChange}
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
                mb: 3,
                width: { xs: "100%", sm: "auto" },
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
              {SUGGESTED_CARGOS.slice(0, 8).map((s) => (
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

            {!isLoggedIn && (
              <Typography
                sx={{
                  color: "#64748b",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                💡 Dica: Crie uma conta para salvar empresas e ver histórico de
                candidaturas.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
