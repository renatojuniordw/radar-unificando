'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { RotatingText } from "@/components/home/rotating-text";

const POPULAR_TAGS = ["DevOps", "Frontend React", "Backend Node", "Python", "Product Manager"];

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
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/busca");
    }
  };

  const handleChipClick = (tag: string) => {
    router.push(`/busca?q=${encodeURIComponent(tag)}`);
  };

  return (
    <Box
      className="section-hero"
      sx={{ position: "relative", overflow: "hidden", pt: { xs: 5, sm: 8 }, pb: { xs: 8, sm: 10 } }}
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
              color: "#ccff00",
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
            RADAR DE VAGAS REMOTAS
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
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 700 }}>
              Gupy
            </Box>{" "}
            e{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 700 }}>
              InHire
            </Box>
            , calcula seu score de match e otimiza seu currículo.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              bgcolor: "#0f172a",
              border: "3px solid #ccff00",
              boxShadow: "8px 8px 0px #000",
              p: { xs: 1.5, sm: 2 },
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              alignItems: "center",
              transition: "all 0.2s ease-in-out",
              "&:focus-within": {
                borderColor: "#ffffff",
                boxShadow: "8px 8px 0px #ccff00",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                flex: 1,
                px: 1.5,
              }}
            >
              <Search size={22} className="text-[#ccff00] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o cargo desejado (ex: React, DevOps, Python)..."
                className="w-full bg-transparent text-white font-mono text-base border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder-[#64748b]"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </Box>

            <button
              type="submit"
              className="btn-neon w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm font-black font-mono uppercase tracking-wider no-underline whitespace-nowrap cursor-pointer active:scale-95 transition-all shrink-0 min-h-[44px]"
            >
              <span>BUSCAR VAGAS AGORA</span>
              <ArrowRight size={16} strokeWidth={3} className="shrink-0" />
            </button>
          </Box>

          {/* Quick Tag Chips Shortcuts */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              POPULARES:
            </Typography>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleChipClick(tag)}
                className="bg-[#0f172a] text-[#cbd5e1] border border-[#334155] px-3 py-1.5 min-h-[36px] text-xs font-mono font-bold hover:border-[#ccff00] hover:text-[#ccff00] transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
              >
                + {tag}
              </button>
            ))}
          </Box>
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
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.75rem",
                  color: "#ccff00",
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
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  mb: 0.5,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "0.825rem", lineHeight: 1.5, m: 0 }}
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