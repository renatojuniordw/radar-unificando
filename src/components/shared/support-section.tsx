import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { Heart } from "lucide-react";

export function SupportSection() {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: 4,
        border: "2px solid #ccff00",
        boxShadow: "6px 6px 0px #ccff00",
        bgcolor: "#0f172a",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 900,
          fontSize: "1.25rem",
          textTransform: "uppercase",
          color: "#ccff00",
          mb: 2,
        }}
      >
        <Heart size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
        APOIE O PROJETO
      </Typography>
      <Typography sx={{ color: "#94a3b8", maxWidth: 520, mx: "auto", mb: 3 }}>
        Sabia que o Radar é mantido por um único desenvolvedor? O site é 100%
        gratuito, mas cada busca, análise e conversa com a IA consome tokens e
        servidores. Se a ferramenta te ajudou hoje, apoie o projeto com um PIX
        de qualquer valor. Seu suporte mantém a
        plataforma viva e acessível para todos.
      </Typography>
      <Link href="/doar" passHref style={{ textDecoration: "none" }}>
        <Button
          variant="contained"
          startIcon={<Heart size={16} />}
          sx={{
            bgcolor: "#ccff00",
            color: "#020617",
            fontWeight: 900,
            textTransform: "uppercase",
            borderRadius: 0,
            border: "2px solid #020617",
            boxShadow: "4px 4px 0px #ffffff",
            "&:hover": { bgcolor: "#ffffff", boxShadow: "none" },
          }}
        >
          Quero doar
        </Button>
      </Link>
    </Box>
  );
}
