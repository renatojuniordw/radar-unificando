"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import { RotatingText } from "@/components/home/rotating-text";
import { JobSearchBar } from "@/components/shared/job-search-bar";
import { tokens } from "@/lib/infrastructure/ui/tokens";

const POPULAR_TAGS = [
  "DevOps",
  "Frontend React",
  "Backend Node",
  "Python",
  "Product Manager",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "PESQUISE VAGAS",
    desc: "Busca em tempo real no Gupy e InHire sem precisar de múltiplos cadastros.",
  },
  {
    step: "02",
    title: "ANÁLISE DE SCORE ATS",
    desc: "A IA calcula a compatibilidade do seu perfil e destaca as skills necessárias.",
  },
  {
    step: "03",
    title: "ADAPTE E CANDIDATE-SE",
    desc: "Receba sugestões diretas para ajustar seu currículo e passar na triagem.",
  },
];

export function MarketingHero() {
  const router = useRouter();
  const [roleQueries, setRoleQueries] = useState<string[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleQueries.length > 0) {
      const queryStr = roleQueries.join(",");
      router.push(`/busca?q=${encodeURIComponent(queryStr)}`);
    } else {
      router.push("/busca");
    }
  };

  return (
    <Box
      className="section-hero"
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 5, sm: 8 },
        pb: { xs: 8, sm: 10 },
      }}
    >
      {/* Background Radar Grid Glow */}
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
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ maxWidth: 800, mx: "auto", textAlign: "center", mb: 6 }}>
          {/* Badge */}
          <Box
            className="badge-neon"
            sx={{
              mb: 2.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.75,
              fontSize: "0.75rem",
            }}
          >
            <Sparkles size={14} />
            <span>GUPY + INHIRE · BUSCA EM TEMPO REAL</span>
          </Box>

          {/* Main Title */}
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: tokens.accent,
              fontSize: {
                xs: "2.25rem",
                sm: "3.5rem",
                md: "4.25rem",
              },
              lineHeight: 0.95,
              textTransform: "uppercase",
              mb: 2.5,
            }}
          >
            RADAR DE VAGAS
          </Typography>

          {/* Subtitle */}
          <Typography
            component="h2"
            sx={{
              mb: 4,
              maxWidth: 680,
              mx: "auto",
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              fontFamily: "var(--font-family-inter)",
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            A plataforma inteligente que busca vagas de <RotatingText /> em
            tempo real no{" "}
            <Box component="span" sx={{ color: tokens.surface, fontWeight: 700 }}>
              Gupy
            </Box>{" "}
            e{" "}
            <Box component="span" sx={{ color: tokens.surface, fontWeight: 700 }}>
              InHire
            </Box>
            , calcula seu score de match e otimiza seu currículo.
          </Typography>

          {/* Componente Unificado de Busca por Tags na Home */}
          <JobSearchBar
            variant="hero"
            roleQueries={roleQueries}
            onRoleQueriesChange={setRoleQueries}
            onSubmit={handleSearchSubmit}
            suggestedRoles={POPULAR_TAGS}
          />
        </Box>

        {/* Passo a Passo Limpo e Minimalista */}
        <Box
          id="como-funciona"
          sx={{
            pt: 4,
            borderTop: "1px solid #1e293b",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: { xs: 3, sm: 4 },
          }}
        >
          {HOW_IT_WORKS.map((item) => (
            <Box
              key={item.step}
              sx={{
                textAlign: "left",
                p: 2.5,
                bgcolor: "#0f172a/50",
                borderLeft: "3px solid #ccff00",
              }}
            >
              <Typography
                sx={{
                  fontFamily: tokens.fontMono,
                  fontSize: "0.75rem",
                  color: tokens.accent,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  mb: 0.75,
                }}
              >
                PASSO {item.step}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: tokens.surface,
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  mb: 0.5,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: "0.825rem",
                  lineHeight: 1.5,
                  m: 0,
                }}
              >
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
