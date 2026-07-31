"use client";

import { Container, Box, Typography } from "@mui/material";
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
          opacity: 0.04,
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="xl"
        sx={{ py: { xs: 4, md: 5 }, position: "relative", zIndex: 1 }}
      >
        <Box className="badge-neon" sx={{ mb: 1 }}>
          GUPY + INHIRE · GRÁTIS
        </Box>

        {isLoggedIn && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "#f8fafc",
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                mb: 0.5,
              }}
            >
              OLÁ, {primeiroNome.toUpperCase()}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#94a3b8",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
              }}
            >
              Encontramos vagas que combinam com seu perfil.
            </Typography>
          </Box>
        )}

        {isLoggedIn && !perfilCompleto && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              border: "2px solid #ccff00",
              bgcolor: "rgba(204, 255, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 1,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
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
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#ccff00",
            fontSize: { xs: "2rem", md: "3.5rem", lg: "4.5rem" },
            lineHeight: 0.9,
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          RADAR
          <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>
            {" "}
          </Box>
          <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
            <br />
          </Box>
          DE VAGAS
        </Typography>

        <Typography
          sx={{
            mb: 3,
            maxWidth: 600,
            color: "#94a3b8",
            fontSize: { xs: "0.85rem", md: "0.95rem" },
            fontFamily:
              "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1.6,
          }}
        >
          Vagas de <RotatingText /> em{" "}
          <Box component="span" sx={{ color: "white" }}>
            Gupy
          </Box>{" "}
          e{" "}
          <Box component="span" sx={{ color: "white" }}>
            InHire
          </Box>
          , em tempo real.
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

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <CompanyInput
              value={empresas}
              onChange={onEmpresasChange}
              autoFocus
              dark
              compact
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 280 }}>
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
              mt: 1.5,
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
            mt: 2.5,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            onClick={onStart}
            disabled={running || cooldown > 0}
            className="btn-neon"
            style={{ padding: "12px 32px", fontSize: "0.85rem" }}
          >
            {running
              ? "BUSCANDO..."
              : cooldown > 0
                ? `AGUARDAR ${Math.floor(cooldown / 60)}min ${cooldown % 60}s`
                : "EXECUTAR BUSCA"}
          </button>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.55rem",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Sugestões:
          </Typography>
          {SUGGESTED_CARGOS.map((s) => (
            <button
              key={s}
              onClick={() => onAddSuggestion(s)}
              style={{
                fontWeight: 700,
                fontSize: "0.6rem",
                cursor: "pointer",
                border: "1px solid #334155",
                color: "#64748b",
                background: "transparent",
                padding: "3px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "ui-monospace, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ccff00";
                e.currentTarget.style.color = "#ccff00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              {s}
            </button>
          ))}
        </Box>

        {!isLoggedIn && (
          <Typography
            sx={{
              mt: 3,
              color: "#334155",
              fontWeight: 700,
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Crie uma conta para salvar resultados e acompanhar candidaturas.
          </Typography>
        )}
      </Container>
    </Box>
  );
}
