import { tool } from "ai";
import { z } from "zod";
import type { JobAnalysis } from "@/lib/core/ai/job-analyzer";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";
import { analyzeWithCache } from "./shared";

export function createAnalyzeJobFitTool(userId: string) {
  // Dedup por turno: evita reprocessar a mesma vaga se o modelo chamar
  // analyze_job_fit mais de uma vez no mesmo turno (múltiplos steps).
  const turnAnalysisCache = new Map<string, Promise<JobAnalysis>>();

  return tool({
    description:
      "Analisar a compatibilidade do perfil do usuário com uma vaga específica. Use o título e a descrição já retornados por search_jobs — não invente ou peça um ID.",
    inputSchema: z.object({
      jobTitle: z
        .string()
        .min(1, "Título da vaga obrigatório")
        .max(200, "Título muito longo")
        .trim()
        .describe(
          'Título da vaga (campo "titulo" retornado por search_jobs)',
        ),
      jobDescription: z
        .string()
        .min(10, "Descrição muito curta")
        .max(5000, "Descrição muito longa")
        .trim()
        .describe(
          'Descrição da vaga (campo "descricao" retornado por search_jobs)',
        ),
    }),
    execute: async ({
      jobTitle,
      jobDescription,
    }: {
      jobTitle: string;
      jobDescription: string;
    }) => {
      debugLog(
        `[chat-tools] analyze_job_fit chamado com jobTitle="${jobTitle}"`,
      );

      const turnKey = `${jobTitle.trim().toLowerCase()}|${jobDescription.trim().toLowerCase()}`;
      const existing = turnAnalysisCache.get(turnKey);
      if (existing) {
        debugLog(
          `[chat-tools] analyze_job_fit: reaproveitando resultado do turno para "${jobTitle}"`,
        );
        return existing;
      }

      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };

      const promise = analyzeWithCache(
        userId,
        profile,
        jobTitle,
        jobDescription,
      );
      turnAnalysisCache.set(turnKey, promise);
      return promise;
    },
  });
}
