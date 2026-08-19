import { tool } from "ai";
import { z } from "zod";
import {
  generateAdaptedResume,
  adaptedResumeToMarkdown,
  type AdaptedResume,
} from "@/lib/core/ai/resume-adaptation-generator";
import { enforceVeracity } from "@/lib/core/ai/resume-veracity";
import { RESUME_ADAPTATION_PROMPT_VERSION } from "@/lib/core/ai/prompts/resume-adaptation";
import {
  computeCacheKey,
  getCached,
  saveToCache,
} from "@/lib/core/ai/generated-content-cache";
import {
  analyzeAtsWithCache,
  buildAtsResumeInput,
} from "@/lib/core/ai/ats/ats-service";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";

export function createGenerateResumeTool(userId: string) {
  return tool({
    description:
      "Gerar um currículo adaptado (reescrito) para uma vaga específica, incorporando palavras-chave da vaga sem inventar fatos. Use título e descrição já retornados por search_jobs — não invente dados.",
    inputSchema: z.object({
      jobTitle: z
        .string()
        .min(1)
        .max(200)
        .trim()
        .describe('Título da vaga (campo "titulo" de search_jobs)'),
      jobDescription: z
        .string()
        .max(5000)
        .trim()
        .optional()
        .default("")
        .describe(
          'Descrição da vaga (campo "descricao" de search_jobs), se disponível',
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
        `[chat-tools] generate_resume chamado com jobTitle="${jobTitle}"`,
      );
      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };

      const resumeContext =
        profile.resumeMarkdown || profile.resumeText || "";
      if (!resumeContext || resumeContext.length < 30) {
        return {
          error:
            "Nenhum currículo encontrado. Importe seu currículo primeiro.",
        };
      }

      const ats = await analyzeAtsWithCache(
        userId,
        buildAtsResumeInput(profile),
        {
          jobDescription,
          traceId: crypto.randomUUID(),
        },
      );
      const atsKeywords = ats.analysis.missingKeywords ?? [];

      const cacheKey = computeCacheKey(RESUME_ADAPTATION_PROMPT_VERSION, [
        jobTitle,
        jobDescription,
        resumeContext,
        atsKeywords.join("|"),
      ]);
      const cached = await getCached<AdaptedResume>(
        userId,
        "resume_adaptation",
        cacheKey,
      );
      if (cached) {
        const verified = enforceVeracity(resumeContext, cached);
        return {
          resume: verified.resume,
          resumeMarkdown: adaptedResumeToMarkdown(verified.resume),
        };
      }

      const traceId = crypto.randomUUID();
      const resume = await generateAdaptedResume(
        resumeContext,
        jobTitle,
        jobDescription,
        {
          atsKeywords,
          traceId,
        },
      );

      await saveToCache(userId, "resume_adaptation", cacheKey, resume);
      const verified = enforceVeracity(resumeContext, resume);
      return {
        resume: verified.resume,
        resumeMarkdown: adaptedResumeToMarkdown(verified.resume),
      };
    },
  });
}
