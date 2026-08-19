import { tool } from "ai";
import { z } from "zod";
import { profileRepository } from "@/lib/infrastructure/repositories";
import {
  analyzeAtsWithCache,
  buildAtsResumeInput,
} from "@/lib/core/ai/ats/ats-service";
import { debugLog } from "@/lib/utils/debug";

export function createAnalyzeAtsScoreTool(userId: string) {
  return tool({
    description:
      'Analisar a compatibilidade do currículo do usuário com sistemas ATS (Applicant Tracking System — filtros automáticos de currículo). Retorna score 0-100, pontos fortes, palavras-chave faltando, problemas de formatação e recomendações. Use quando o usuário perguntar se o currículo passa em filtros automáticos, como otimizar o CV para uma vaga, ou pedir "análise ATS". Se uma descrição de vaga for fornecida, o score considera o keyword match com a vaga.',
    inputSchema: z.object({
      jobDescription: z
        .string()
        .max(8000)
        .optional()
        .describe(
          "Descrição da vaga alvo (opcional). Se fornecida, o score considera o keyword match com a vaga.",
        ),
    }),
    execute: async ({ jobDescription }: { jobDescription?: string }) => {
      debugLog("[chat-tools] analyze_ats_score chamado");
      const profile = await profileRepository.findByUserId(userId);
      const rawResumeText =
        profile?.resumeText || profile?.resumeMarkdown || "";
      if (!rawResumeText || rawResumeText.length < 30) {
        return {
          error:
            "Nenhum currículo encontrado. Importe seu currículo primeiro.",
        };
      }
      const resumeText = buildAtsResumeInput(profile!);
      const result = await analyzeAtsWithCache(userId, resumeText, {
        jobDescription,
        traceId: crypto.randomUUID(),
      });
      return {
        score: result.analysis.score,
        summary: result.analysis.summary,
        strengths: result.analysis.strengths,
        missingKeywords: result.analysis.missingKeywords,
        formattingIssues: result.analysis.formattingIssues,
        recommendations: result.analysis.recommendations,
        heuristicChecks: result.heuristics.checks,
      };
    },
  });
}
