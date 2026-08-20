"use client";

import { Box, Typography, Button } from "@mui/material";
import { WarningAmber, FileUploadOutlined } from "@mui/icons-material";

interface Props {
  ageDays: number;
  onStartImport?: () => void;
}

export function OutdatedProfileBanner({ ageDays, onStartImport }: Props) {
  if (ageDays < 60) return null;

  return (
    <Box
      className="card-brutalist"
      sx={{
        p: 2.5,
        mb: 3,
        bgcolor: "#fffbebf5",
        border: "3px solid #f59e0b",
        boxShadow: "5px 5px 0px #000000",
        color: "#78350f",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: "50%",
            bgcolor: "#f59e0b",
            color: "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mt: 0.2,
          }}
        >
          <WarningAmber sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, monospace",
              color: "#92400e",
            }}
          >
            Currículo base atualizado há {ageDays} dias
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#78350f", mt: 0.5, lineHeight: 1.4 }}>
            Mantenha seu perfil em dia para que as análises ATS e currículos adaptados reflitam suas conquistas e cargos mais recentes.
          </Typography>
        </Box>
      </Box>

      {onStartImport && (
        <Button
          variant="contained"
          onClick={onStartImport}
          startIcon={<FileUploadOutlined sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: "#f59e0b",
            color: "#020617",
            fontWeight: 900,
            fontSize: "0.7rem",
            fontFamily: "ui-monospace, monospace",
            border: "2px solid #020617",
            boxShadow: "3px 3px 0px #000",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0,
            "&:hover": { bgcolor: "#d97706" },
          }}
        >
          Atualizar Agora
        </Button>
      )}
    </Box>
  );
}
