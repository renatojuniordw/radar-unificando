import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";
import { RotatingText } from "@/components/home/rotating-text";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "ENVIE SEU CURRÍCULO",
    desc: "Importe em PDF ou cole o texto. A IA identifica suas habilidades, experiência e área.",
  },
  {
    step: "02",
    title: "BUSQUE VAGAS EM TEMPO REAL",
    desc: "Pesquise cargos e empresas no Gupy e InHire. Resultados sempre atualizados na hora.",
  },
  {
    step: "03",
    title: "DESCUBRA OS PONTOS DE MELHORIA",
    desc: "Veja o score de compatibilidade e as skills que faltam para a vaga — com trilhas para estudar.",
  },
];

export function MarketingHero() {
  return (
    <Box
      className="section-hero"
      sx={{ position: "relative", overflow: "hidden" }}
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
          py: { xs: 6, sm: 8, md: 10 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ maxWidth: 720 }}>
          <Box className="badge-neon" sx={{ mb: 2 }}>
            GUPY + INHIRE · GRÁTIS
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
              mb: 4,
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

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
              mb: 5,
            }}
          >
            <Link href="/busca" style={{ textDecoration: "none" }}>
              <Box
                className="btn-neon"
                sx={{
                  display: "inline-block",
                  px: 3.5,
                  py: 2,
                  fontSize: "0.85rem",
                  fontWeight: 900,
                }}
              >
                BUSCAR VAGAS AGORA →
              </Box>
            </Link>
            <Link href="/perfil" style={{ textDecoration: "none" }}>
              <Box
                className="btn-dark"
                sx={{
                  display: "inline-block",
                  px: 3.5,
                  py: 2,
                  fontSize: "0.85rem",
                  fontWeight: 900,
                }}
              >
                COMPLETAR PERFIL
              </Box>
            </Link>
            <Link href="#como-funciona" style={{ textDecoration: "none" }}>
              <Box
                sx={{
                  display: "inline-block",
                  px: 3.5,
                  py: 2,
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  color: "#94a3b8",
                  border: "2px solid #334155",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  "&:hover": { borderColor: "#ccff00", color: "#ccff00" },
                }}
              >
                COMO FUNCIONA
              </Box>
            </Link>
          </Box>
        </Box>

        {/* Como funciona em 3 passos */}
        <Box
          id="como-funciona"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {HOW_IT_WORKS.map((item) => (
            <Box
              key={item.step}
              sx={{
                bgcolor: "#0f172a",
                border: "2px solid #334155",
                boxShadow: "4px 4px 0px #000",
                p: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.7rem",
                  color: "#ccff00",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  mb: 1,
                }}
              >
                {item.step}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  mb: 0.75,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.5 }}
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