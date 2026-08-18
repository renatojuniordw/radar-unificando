import { tool } from "ai";
import { z } from "zod";
import { recommendCourses } from "@/lib/core/courses/course-matcher";
import { buildAffiliateUrl } from "@/lib/core/courses/course-provider";
import { searchUdemyCourses } from "@/lib/core/courses/impact-client";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";

export function createRecommendCoursesTool(userId: string) {
  return tool({
    description:
      "Recomendar cursos de capacitação (Udemy) para skills específicas que faltam no currículo do usuário. Use quando analyze_job_fit ou analyze_ats_score indicar missingSkills/missingKeywords. Retorna até 4 cursos com link de afiliado. Apresente cada curso no formato de bloco de curso (📚) — no máximo 3 blocos por resposta, apenas quando fizer sentido, nunca em toda resposta.",
    inputSchema: z.object({
      skills: z
        .array(z.string().min(1).max(60).trim())
        .min(1, "Informe pelo menos 1 skill")
        .max(6, "Informe no máximo 6 skills")
        .describe(
          'Skills/requisitos faltando no currículo (ex: ["Kubernetes", "Excel Avançado"])',
        ),
    }),
    execute: async ({ skills }: { skills: string[] }) => {
      debugLog(
        `[chat-tools] recommend_courses chamado com skills=${JSON.stringify(skills)}`,
      );
      const profile = await profileRepository.findByUserId(userId);
      const area = profile?.area || profile?.currentRole || null;
      const courses = recommendCourses(skills, area, 4);

      // Enriquecimento: skill sem match no catálogo curado → busca avulsos
      // na API Impact (Udemy). Limitado a 2 chamadas para não atrasar o chat.
      const matchedTags = courses.flatMap((c) => c.skillTags);
      const unmatched = skills.filter(
        (s) =>
          !matchedTags.some(
            (t) =>
              t.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(t.toLowerCase()),
          ),
      );

      const merged = [...courses];
      if (unmatched.length > 0) {
        const top = unmatched.slice(0, 2);
        const apiResults = await Promise.all(
          top.map((skill) => searchUdemyCourses(skill, 2)),
        );
        for (const list of apiResults) {
          for (const c of list) {
            if (!merged.some((x) => x.id === c.id)) merged.push(c);
          }
        }
      }

      return {
        cursos: merged.slice(0, 4).map((c) => ({
          titulo: c.title,
          plataforma: "Udemy",
          skill: c.skillTags[0],
          preco: c.priceLabel,
          // Cursos da API Impact já são rastreados pelo script do site.
          url: c.id.startsWith("impact-") ? c.url : buildAffiliateUrl(c),
        })),
      };
    },
  });
}
