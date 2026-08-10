"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDebounce } from "use-debounce";
import { browserStorage } from "@/lib/infrastructure/storage/browser-storage";
import { useProfile } from "@/hooks/useProfile";
import { recommendCourses, skillSlug } from "@/lib/core/courses/course-matcher";
import { COURSES, POPULAR_SKILLS } from "@/lib/core/courses/course-catalog";
import type { Course } from "@/lib/core/courses/course-provider";
import { CourseCard } from "@/components/cursos/course-card";
import { CourseGrid } from "@/components/cursos/course-grid";
import { ChatTeaser } from "@/components/shared/chat-teaser";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

interface SearchResult {
  query: string;
  courses: Course[];
  source: "impact" | "curated";
}

export default function CursosPage() {
  const { data: session } = useSession();
  const profile = useProfile();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 400);
  const [lastTerms, setLastTerms] = useState<string[]>([]);
  const [searched, setSearched] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Última busca do usuário anônimo (IndexedDB) para personalizar a seção.
  useEffect(() => {
    let active = true;
    browserStorage
      .getFilters()
      .then((filters) => {
        if (active) setLastTerms(filters?.roles ?? []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Busca dinâmica: API Impact (Udemy avulsos) com fallback para o catálogo
  // curado local. Debounced (400ms) para não disparar a cada tecla.
  useEffect(() => {
    const q = debouncedQuery.trim();
    let active = true;
    if (!q) return;

    void (async () => {
      setSearchLoading(true);
      try {
        const res = await fetch("/api/courses/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = res.ok
          ? ((await res.json()) as { courses?: Course[]; source?: "impact" | "curated" })
          : null;
        if (!active) return;
        if (data?.courses?.length) {
          setSearched({
            query: q,
            courses: data.courses,
            source: data.source ?? "curated",
          });
        } else {
          setSearched(null);
        }
      } catch {
        if (active) setSearched(null);
      } finally {
        if (active) setSearchLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const area = session ? profile.area || profile.currentRole : null;
  const recommended = useMemo(
    () => recommendCourses(lastTerms, area, 4),
    [lastTerms, area],
  );

  const trimmedQuery = debouncedQuery.trim();
  const visible =
    searched && searched.query === trimmedQuery ? searched.courses : COURSES;
  const searching = Boolean(trimmedQuery);

  return (
    <Box sx={{ bgcolor: "#020617", color: "#ffffff", minHeight: "100vh" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ maxWidth: 720, mb: 4 }}>
          <Box className="badge-neon" sx={{ mb: 2 }}>
            ALURA + UDEMY · LINKS DE AFILIADO
          </Box>
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#ccff00",
              fontSize: { xs: "2rem", sm: "3rem" },
              lineHeight: 1,
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            CURSOS PARA FECHAR SEUS GAPS
          </Typography>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Identificamos as skills que as vagas mais pedem. Estude exatamente o
            que falta no seu perfil — cursos avulsos baratos ou trilhas completas.
          </Typography>
        </Box>

        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por skill: Excel, Python, Kubernetes, RH, Power BI…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#ccff00" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 5,
            maxWidth: 640,
            "& .MuiOutlinedInput-root": {
              bgcolor: "#0f172a",
              color: "#ffffff",
              fontFamily: "ui-monospace, monospace",
              "& fieldset": { border: "2px solid #334155", borderRadius: 0 },
              "&:hover fieldset": { borderColor: "#ccff00" },
              "&.Mui-focused fieldset": { borderColor: "#ccff00" },
            },
          }}
        />

        <Box sx={{ mb: 5 }}>
          <SectionEyebrow color="#94a3b8" mb={1.5}>
            Skills mais procuradas
          </SectionEyebrow>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {POPULAR_SKILLS.map((skill) => (
              <Link key={skill} href={`/cursos/${skillSlug(skill)}`}>
                <Box
                  sx={{
                    bgcolor: "#0f172a",
                    border: "2px solid #334155",
                    color: "#cbd5e1",
                    px: 1.5,
                    py: 0.75,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "ui-monospace, monospace",
                    "&:hover": { borderColor: "#ccff00", color: "#ccff00" },
                  }}
                >
                  {skill}
                </Box>
              </Link>
            ))}
          </Box>
        </Box>

        {!session && (
          <Box sx={{ mb: 5, maxWidth: 480 }}>
            <ChatTeaser />
          </Box>
        )}

        {!searching && (
          <Box sx={{ mb: 5 }}>
            <SectionEyebrow>
              {lastTerms.length > 0
                ? `Com base na sua última busca: ${lastTerms.join(", ")}`
                : "Cursos em destaque"}
            </SectionEyebrow>
            <CourseGrid>
              {recommended.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </CourseGrid>
          </Box>
        )}

        <Box>
          <SectionEyebrow>
            {searching
              ? searchLoading
                ? "Buscando cursos…"
                : searched?.source === "impact"
                  ? `Cursos Udemy para "${trimmedQuery}"`
                  : `Resultados para "${trimmedQuery}"`
              : "Catálogo completo"}
          </SectionEyebrow>
          <CourseGrid>
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CourseGrid>
        </Box>

        <Typography
          sx={{
            mt: 6,
            pt: 3,
            borderTop: "1px solid #1e293b",
            color: "#475569",
            fontSize: "0.7rem",
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          Alguns links desta página são de afiliados (Alura e Udemy) e podem
          gerar comissão para a manutenção do projeto, sem custo adicional para
          você. A recomendação é baseada nas skills das vagas que você busca.
        </Typography>
      </Container>
    </Box>
  );
}