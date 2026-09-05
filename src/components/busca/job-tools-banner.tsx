"use client";

import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { tokens } from "@/lib/infrastructure/ui/tokens";

export type JobToolsBannerVariant = "anonymous" | "no-resume";

interface Props {
  variant: JobToolsBannerVariant;
}

/**
 * Banner contextual que mostra ao usuário o que ele desbloqueia ao entrar
 * (anônimo) ou ao importar o currículo (logado sem currículo). Evita que
 * ferramentas existentes (Análise ATS, Currículo IA, Comparativo de vagas)
 * fiquem invisíveis para quem ainda não está logado.
 */
export function JobToolsBanner({ variant }: Props) {
  const isAnonymous = variant === "anonymous";

  return (
    <Box
      data-testid={isAnonymous ? "job-tools-banner-anonymous" : "job-tools-banner-no-resume"}
      className="card-brutalist"
      sx={{
        p: 2.5,
        mb: 3,
        bgcolor: isAnonymous ? "#ccff00" : "#fffbeb",
        border: "3px solid #020617",
        boxShadow: "5px 5px 0px #000000",
        color: tokens.primary,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: "50%",
            bgcolor: isAnonymous ? "#020617" : "#f59e0b",
            color: isAnonymous ? "#ccff00" : "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mt: 0.2,
          }}
        >
          <span role="img" aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
            {isAnonymous ? "🔓" : "📄"}
          </span>
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              fontFamily: tokens.fontMono,
              color: tokens.primary,
            }}
          >
            {isAnonymous ? "Desbloqueie as ferramentas de carreira" : "Seu perfil está incompleto"}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#334155", mt: 0.5, lineHeight: 1.4 }}>
            {isAnonymous
              ? "Com uma conta grátis você usa: Análise ATS de cada vaga, Currículo adaptado por IA, Comparativo de vagas no assistente e salva vagas e empresas."
              : "Adicione seu currículo para liberar a Análise ATS e o Currículo adaptado por IA em cada vaga."}
          </Typography>
        </Box>
      </Box>

      <Box
        data-testid="job-tools-banner-actions"
        sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", flexShrink: 0 }}
      >
        {isAnonymous ? (
          <>
            <Link
              data-testid="job-tools-banner-login-link"
              href="/login?callbackUrl=/busca"
              style={{ textDecoration: "none" }}
            >
              <Box className="btn-neon" sx={{ px: 2, py: 1, fontSize: "0.7rem" }}>
                ENTRAR
              </Box>
            </Link>
            <Link
              data-testid="job-tools-banner-register-link"
              href="/register?callbackUrl=/busca"
              style={{ textDecoration: "none" }}
            >
              <Box className="btn-dark" sx={{ px: 2, py: 1, fontSize: "0.7rem" }}>
                CRIAR CONTA
              </Box>
            </Link>
          </>
        ) : (
          <Link
            data-testid="job-tools-banner-perfil-link"
            href="/perfil"
            style={{ textDecoration: "none" }}
          >
            <Box className="btn-dark" sx={{ px: 2, py: 1, fontSize: "0.7rem" }}>
              IMPORTAR CURRÍCULO
            </Box>
          </Link>
        )}
      </Box>
    </Box>
  );
}