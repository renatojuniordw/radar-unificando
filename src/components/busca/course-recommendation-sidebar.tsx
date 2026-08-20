"use client";

import { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import Link from "next/link";
import { recommendCourses } from "@/lib/core/courses/course-matcher";
import { CourseCard } from "@/components/cursos/course-card";
import { tokens } from "@/lib/infrastructure/ui/tokens";

interface Props {
  terms: string[];
  area?: string | null;
}

export function CourseRecommendationSidebar({ terms, area }: Props) {
  const courses = useMemo(
    () => recommendCourses(terms, area, 4),
    [terms, area],
  );

  const activeQueryLabel = useMemo(() => {
    if (terms && terms.length > 0) return terms.slice(0, 2).join(", ");
    if (area) return area;
    return null;
  }, [terms, area]);

  return (
    <Box
      className="card-panel"
      sx={{
        p: { xs: 2.5, sm: 3 },
        width: "100%",
        mt: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
          pb: 1.5,
          borderBottom: "1px solid #1e293b",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography
            sx={{
              fontFamily: tokens.fontMono,
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              color: tokens.accent,
              fontWeight: 900,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span>📚</span> CURSOS RECOMENDADOS PARA VOCÊ
          </Typography>

          {activeQueryLabel && (
            <Chip
              label={`Foco: ${activeQueryLabel}`}
              size="small"
              sx={{
                bgcolor: "rgba(204, 255, 0, 0.1)",
                color: tokens.accent,
                border: "1px solid #ccff00",
                fontFamily: tokens.fontMono,
                fontSize: "0.7rem",
                fontWeight: 800,
                borderRadius: 0,
              }}
            />
          )}
        </Box>

        <Link href="/cursos" style={{ textDecoration: "none" }}>
          <Typography
            sx={{
              fontFamily: tokens.fontMono,
              fontSize: "0.75rem",
              color: "#94a3b8",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              "&:hover": { color: tokens.accent },
            }}
          >
            EXPLORAR CATÁLOGO COMPLETO →
          </Typography>
        </Link>
      </Box>

      {courses.length === 0 ? (
        <Typography sx={{ color: tokens.muted, fontSize: "0.85rem", lineHeight: 1.5, fontFamily: tokens.fontMono }}>
          Busque por um cargo no topo da página para receber sugestões de cursos da Udemy alinhados às qualificações da vaga.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} compact={false} origin="sidebar" />
          ))}
        </Box>
      )}

      <Typography
        sx={{
          mt: 2.5,
          pt: 1.5,
          borderTop: "1px solid #1e293b",
          color: "#475569",
          fontSize: "0.7rem",
          fontFamily: tokens.fontMono,
          lineHeight: 1.4,
        }}
      >
        💡 Cursos parceiros recomendados com base nas tecnologias mais exigidas pelas vagas. Ao se inscrever, você se capacita e ajuda o Radar Unificando a continuar 100% gratuito.
      </Typography>
    </Box>
  );
}