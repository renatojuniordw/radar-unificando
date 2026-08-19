import { tool } from "ai";
import { z } from "zod";
import { generateCoverLetter } from "@/lib/core/ai/cover-letter-generator";
import { COVER_LETTER_PROMPT_VERSION } from "@/lib/core/ai/prompts/cover-letter";
import {
  computeCacheKey,
  getCached,
  saveToCache,
} from "@/lib/core/ai/generated-content-cache";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";

export function createGenerateCoverLetterTool(userId: string) {
  return tool({
    description:
      "Gerar uma carta de apresentação personalizada do usuário para uma vaga específica. Use título e descrição já retornados por search_jobs — não invente dados.",
    inputSchema: z.object({
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
        .describe('Descrição da vaga (campo "descricao" de search_jobs)'),
    }),
    execute: async ({
      jobTitle,
      jobDescription,
    }: {
      jobTitle: string;
      jobDescription: string;
    }) => {
      debugLog(
        `[chat-tools] generate_cover_letter chamado com jobTitle="${jobTitle}"`,
      );
      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };

      const resumeContext =
        profile.resumeMarkdown || profile.resumeText || "";
      const skills = (profile.skills as string[]) || [];

      const cacheKey = computeCacheKey(COVER_LETTER_PROMPT_VERSION, [
        jobTitle,
        jobDescription,
        skills,
        resumeContext,
      ]);
      const cached = await getCached(userId, "cover_letter", cacheKey);
      if (cached) return cached;

      const traceId = crypto.randomUUID();
      const letter = await generateCoverLetter(
        resumeContext,
        jobTitle,
        jobDescription,
        skills,
        traceId,
      );

      await saveToCache(userId, "cover_letter", cacheKey, letter);
      return letter;
    },
  });
}
