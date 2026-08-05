import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { Sparkles, ShieldCheck, Zap, UserCheck, ArrowRight, Code2 } from "lucide-react";
import { SupportSection } from "@/components/shared/support-section";

export const metadata: Metadata = {
  title: "Sobre | Radar Unificando",
  description:
    "Conheça o Radar Unificando: a ferramenta que unifica vagas de tecnologia de Gupy e InHire em um só lugar, com busca inteligente e recomendações personalizadas.",
  openGraph: {
    title: "Sobre | Radar Unificando",
    description:
      "Conheça o Radar Unificando: a ferramenta que unifica vagas de tecnologia de Gupy e InHire em um só lugar.",
  },
};

export default function SobrePage() {
  return (
    <Box sx={{ bgcolor: "#020617", color: "#ffffff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Header Badge & Title */}
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 10 } }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "#ccff00",
              color: "#020617",
              px: 2,
              py: 0.75,
              fontWeight: 900,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "2px solid #020617",
              boxShadow: "4px 4px 0px #ffffff",
              mb: 3,
            }}
          >
            <Sparkles size={14} />
            SOBRE O RADAR UNIFICANDO
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.25rem", sm: "3.5rem", md: "4.5rem" },
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              textTransform: "uppercase",
              mb: 3,
              color: "#ffffff",
            }}
          >
            CONECTANDO VOCÊ ÀS <br />
            <Box component="span" sx={{ color: "#ccff00" }}>
              MELHORES VAGAS DO BRASIL
            </Box>
          </Typography>

          <Typography
            sx={{
              color: "#94a3b8",
              fontFamily: "ui-monospace, monospace",
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              maxWidth: 720,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            O Radar Unificando é uma plataforma inteligente que consolida vagas de emprego de grandes portais (como Gupy e InHire) em tempo real, cobrindo todas as áreas profissionais com análise de aderência e assistente de IA.
          </Typography>
        </Box>

        {/* Section 1: A Missão */}
        <Box
          sx={{
            bgcolor: "#0f172a",
            border: "4px solid #1e293b",
            boxShadow: "8px 8px 0px #000000",
            p: { xs: 3, sm: 5, md: 6 },
            mb: { xs: 6, md: 8 },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.5rem", sm: "2rem" },
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              mb: 2,
              color: "#ccff00",
            }}
          >
            NOSSA MISSÃO: BUSCA DE VAGAS SEM COMPLICAÇÃO
          </Typography>
          <Typography
            sx={{
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.7,
              mb: 2,
            }}
          >
            Procurar emprego costuma ser uma tarefa exaustiva: dezenas de abas abertas, cadastros repetitivos e falta de clareza sobre quais vagas realmente combinam com seu perfil.
          </Typography>
          <Typography
            sx={{
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.7,
            }}
          >
            O Radar Unificando foi criado para resolver isso. Ele centraliza a pesquisa, analisa requisitos com Inteligência Artificial e ajuda profissionais de <strong>qualquer segmento</strong> — Marketing, RH, Vendas, Tecnologia, Finanças, Saúde, Design e Operações — a encontrarem oportunidades alinhadas às suas habilidades.
          </Typography>
        </Box>

        {/* Section 2: O Criador (Renato Bezerra) */}
        <Box
          sx={{
            bgcolor: "#0f172a",
            border: "4px solid #ccff00",
            boxShadow: "8px 8px 0px #ccff00",
            p: { xs: 3, sm: 5, md: 6 },
            mb: { xs: 6, md: 8 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Box
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                p: 1.5,
                border: "2px solid #020617",
              }}
            >
              <Code2 size={28} />
            </Box>
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                  lineHeight: 1.1,
                }}
              >
                QUEM DESENVOLVEU
              </Typography>
              <Typography
                sx={{
                  color: "#ccff00",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                RENATO BEZERRA · CRIADOR & ENGENHEIRO DE SOFTWARE
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.7,
              mb: 3,
            }}
          >
            Olá! Sou o <strong>Renato Bezerra</strong>, Engenheiro de Software com ampla experiência em desenvolvimento, arquitetura de sistemas e soluções em Inteligência Artificial Generativa.
          </Typography>

          <Typography
            sx={{
              color: "#cbd5e1",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.7,
              mb: 4,
            }}
          >
            Desenvolvi o Radar Unificando para colocar a tecnologia a serviço do profissional brasileiro. A plataforma une automação em tempo real, segurança avançada de dados (LGPD) e inteligência artificial para que você passe menos tempo procurando vagas e mais tempo conquistando a oportunidade certa.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              component="a"
              href="https://renatobezerra.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                fontWeight: 900,
                fontSize: "0.85rem",
                borderRadius: 0,
                border: "2px solid #020617",
                boxShadow: "4px 4px 0px #ffffff",
                px: 3,
                py: 1.2,
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: "#ffffff",
                  color: "#020617",
                  boxShadow: "none",
                },
              }}
            >
              CONHEÇA MEU PORTFÓLIO
            </Button>

            <Button
              component="a"
              href="https://unificando.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              sx={{
                borderColor: "#ccff00",
                color: "#ccff00",
                fontWeight: 900,
                fontSize: "0.85rem",
                borderRadius: 0,
                px: 3,
                py: 1.2,
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: "rgba(204, 255, 0, 0.1)",
                  borderColor: "#ccff00",
                },
              }}
            >
              CONSULTORIA EM IA
            </Button>
          </Box>
        </Box>

        {/* Section: Apoie o projeto */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <SupportSection />
        </Box>

        {/* Section 3: Pilares */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "1.5rem", sm: "2.25rem" },
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            textAlign: "center",
            mb: 5,
            color: "#ffffff",
          }}
        >
          POR QUE O RADAR É DIFERENTE?
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            mb: { xs: 6, md: 10 },
          }}
        >
          <Box
            sx={{
              bgcolor: "#0f172a",
              border: "3px solid #1e293b",
              p: 3,
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <UserCheck size={32} style={{ color: "#ccff00", marginBottom: 16 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", mb: 1.5, color: "#ffffff" }}>
              TODAS AS PROFISSÕES
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Vagas para qualquer área do mercado: Marketing, Vendas, RH, Financeiro, Tecnologia, Design, Operações e mais.
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#0f172a",
              border: "3px solid #1e293b",
              p: 3,
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <Zap size={32} style={{ color: "#ccff00", marginBottom: 16 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", mb: 1.5, color: "#ffffff" }}>
              TEMPO REAL & MATCH IA
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Consultas diretas nos portais de vagas no momento da busca, com cálculo de compatibilidade de perfil.
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#0f172a",
              border: "3px solid #1e293b",
              p: 3,
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <ShieldCheck size={32} style={{ color: "#ccff00", marginBottom: 16 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", mb: 1.5, color: "#ffffff" }}>
              PRIVACIDADE TOTAL (LGPD)
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Dados criptografados, anonimização automática de dados sensíveis e navegação livre sem rastreamento abusivo.
            </Typography>
          </Box>
        </Box>

        {/* Final Action Box */}
        <Box
          sx={{
            textAlign: "center",
            bgcolor: "#1e293b",
            p: { xs: 4, sm: 6 },
            border: "4px solid #ccff00",
            boxShadow: "8px 8px 0px #000000",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.5rem", sm: "2.25rem" },
              textTransform: "uppercase",
              mb: 2,
              color: "#ffffff",
            }}
          >
            PRONTO PARA ENCONTRAR SUA PRÓXIMA VAGA?
          </Typography>
          <Typography
            sx={{
              color: "#94a3b8",
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.95rem",
              mb: 4,
            }}
          >
            100% gratuito. Comece sua pesquisa em segundos.
          </Typography>

          <Link href="/" passHref style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#ccff00",
                color: "#020617",
                fontWeight: 900,
                fontSize: "1rem",
                borderRadius: 0,
                border: "2px solid #020617",
                boxShadow: "4px 4px 0px #ffffff",
                px: 4,
                py: 1.5,
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  bgcolor: "#ffffff",
                  color: "#020617",
                  boxShadow: "none",
                },
              }}
            >
              IR PARA O MOTOR DE BUSCA <ArrowRight size={20} />
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
