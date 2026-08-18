import { tool } from "ai";
import { z } from "zod";
import { generateInterviewQuestions } from "@/lib/core/ai/interview-questions";
import { INTERVIEW_QUESTIONS_PROMPT_VERSION } from "@/lib/core/ai/prompts/interview-questions";
import {
  computeCacheKey,
  getCached,
  saveToCache,
} from "@/lib/core/ai/generated-content-cache";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";
import { analyzeWithCache } from "./shared";

export function createGetInterviewQuestionsTool(userId: string) {
  return tool({
    description:
      "Gerar um roteiro de perguntas de entrevista personalizadas para uma vaga específica, baseado nos pontos fortes e lacunas do perfil do usuário. Use título e descrição já retornados por search_jobs — não invente dados. Após retornar as perguntas, ofereça-se para conduzir uma simulação de entrevista fazendo uma pergunta de cada vez e dando feedback sobre a resposta do usuário.",
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
        `[chat-tools] get_interview_questions chamado com jobTitle="${jobTitle}"`,
      );
      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };

      const resumeContext =
        profile.resumeMarkdown || profile.resumeText || "";

      const cacheKey = computeCacheKey(INTERVIEW_QUESTIONS_PROMPT_VERSION, [
        jobTitle,
        jobDescription,
        resumeContext,
      ]);
      const cached = await getCached(userId, "interview_questions", cacheKey);
      if (cached) return cached;

      const { matchedSkills, missingSkills } = await analyzeWithCache(
        userId,
        profile,
        jobTitle,
        jobDescription,
      );

      const traceId = crypto.randomUUID();
      const questions = await generateInterviewQuestions(
        resumeContext,
        jobTitle,
        jobDescription,
        matchedSkills,
        missingSkills,
        traceId,
      );

      await saveToCache(userId, "interview_questions", cacheKey, questions);
      return questions;
    },
  });
}
