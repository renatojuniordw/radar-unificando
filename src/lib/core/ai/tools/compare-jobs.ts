import { tool } from "ai";
import { z } from "zod";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";
import { analyzeWithCache, FIT_RANK } from "./shared";

export function createCompareJobsTool(userId: string) {
  return tool({
    description:
      "Comparar de 2 a 5 vagas entre si quanto à compatibilidade com o perfil do usuário. Use título e descrição já retornados por search_jobs para cada vaga — não invente dados. Retorna os resultados já ordenados do melhor para o pior fit; apresente a comparação ao usuário com base nisso.",
    inputSchema: z.object({
      jobs: z
        .array(
          z.object({
            jobTitle: z
              .string()
              .min(1)
              .max(200)
              .trim()
              .describe('Título da vaga (campo "titulo" de search_jobs)'),
            jobDescription: z
              .string()
              .min(10)
              .max(5000)
              .trim()
              .describe(
                'Descrição da vaga (campo "descricao" de search_jobs)',
              ),
          }),
        )
        .min(2, "Informe pelo menos 2 vagas para comparar")
        .max(5, "Compare no máximo 5 vagas por vez"),
    }),
    execute: async ({
      jobs,
    }: {
      jobs: { jobTitle: string; jobDescription: string }[];
    }) => {
      debugLog(`[chat-tools] compare_jobs chamado com ${jobs.length} vagas`);
      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };

      const results = await Promise.all(
        jobs.map(async ({ jobTitle, jobDescription }) => ({
          jobTitle,
          ...(await analyzeWithCache(
            userId,
            profile,
            jobTitle,
            jobDescription,
          )),
        })),
      );

      results.sort((a, b) => FIT_RANK[b.overallFit] - FIT_RANK[a.overallFit]);
      return { ranking: results };
    },
  });
}
