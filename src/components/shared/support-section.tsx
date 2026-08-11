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
        p: { xs: 2.5, sm: 4 },
        border: "2px solid #ccff00",
        boxShadow: { xs: "4px 4px 0px #ccff00", sm: "6px 6px 0px #ccff00" },
        bgcolor: "#0f172a",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 900,
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
          textTransform: "uppercase",
          color: "#ccff00",
          mb: 2,
        }}
      >
        <Heart size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
        APOIE O PROJETO
      </Typography>
      <Typography sx={{ color: "#94a3b8", maxWidth: 520, mx: "auto", mb: 3, fontSize: { xs: "0.85rem", sm: "0.95rem" }, lineHeight: 1.6 }}>
        Sabia que o Radar é mantido por um único desenvolvedor? O site é 100%
        gratuito, mas cada busca, análise e conversa com a IA consome tokens e
        servidores. Se a ferramenta te ajudou hoje, apoie o projeto com um PIX
        de qualquer valor. Seu suporte mantém a
        plataforma viva e acessível para todos.
      </Typography>
      <Link
        href="/doar"
        className="btn-neon w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-black font-mono uppercase tracking-wider no-underline whitespace-nowrap shadow-[4px_4px_0px_#fff] active:scale-95 transition-transform"
      >
        <Heart size={16} fill="currentColor" />
        <span>QUERO DOAR (PIX)</span>
      </Link>
    </Box>
  );
}
