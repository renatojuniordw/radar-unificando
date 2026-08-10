"use client";

import { Box, Typography } from "@mui/material";
import Link from "next/link";

/** CTA para usuários anônimos usarem o assistente de carreira (logado). */
export function ChatTeaser() {
  return (
    <Box className="card-panel" sx={{ p: 2.5 }}>
      <Typography
        sx={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.7rem",
          color: "#ccff00",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          mb: 1,
        }}
      >
        💬 Assistente de Carreira
      </Typography>
      <Typography
        sx={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.55, mb: 1.5 }}
      >
        Analise seu currículo, simule entrevistas e receba recomendações de
        estudos com o assistente de IA. Disponível para usuários logados.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <Box
            className="btn-neon"
            sx={{ display: "inline-block", px: 2, py: 1, fontSize: "0.7rem" }}
          >
            ENTRAR
          </Box>
        </Link>
        <Link href="/register" style={{ textDecoration: "none" }}>
          <Box
            className="btn-dark"
            sx={{ display: "inline-block", px: 2, py: 1, fontSize: "0.7rem" }}
          >
            CRIAR CONTA
          </Box>
        </Link>
      </Box>
    </Box>
  );
}
