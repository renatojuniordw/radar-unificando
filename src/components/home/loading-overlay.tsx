"use client";

import { Box, Typography } from "@mui/material";

export function LoadingOverlay() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        bgcolor: "rgba(2, 6, 23, 0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      <Box
        className="hero-radar"
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)",
          opacity: 0.6,
        }}
      />
      <Typography
        sx={{
          color: "#ccff00",
          fontWeight: 900,
          fontSize: "1.2rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        Buscando vagas...
      </Typography>
      <Typography
        sx={{
          color: "#64748b",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Gupy · InHire
      </Typography>
    </Box>
  );
}
