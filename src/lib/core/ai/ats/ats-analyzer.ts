// ---------------------------------------------------------------------------
// Análise ATS via LLM — score 0-100 + pontos fortes + keywords faltando +
// problemas de formatação + recomendações. Segue o padrão do job-analyzer:
// schema Zod + generate() + prompt com regras de segurança (dados vs instruções).
// ---------------------------------------------------------------------------

import { z } from "zod";
import { normalizeKeyword } from "./normalize";
import type { AtsHeuristic } from "./ats-heuristics";
import { ATS_ANALYZER_PROMPT } from "../prompts/ats-analyzer";
import { llmCall } from "../shared/llm-call";

const LIMITS = {
  resumeText: { min: 30, max: 15000 },
  jobDescription: { max: 8000 },
  keywordItem: { max: 80 },
  keywordsArray: { max: 40 },
  recommendationItem: { max: 500 },
  recommendationsArray: { max: 15 },
} as const;

const inputSchema = z.object({
  resumeText: z
    .string()
    .min(LIMITS.resumeText.min, "Currículo muito curto.")
    .max(LIMITS.resumeText.max, "Currículo excede o tamanho máximo permitido."),
  jobDescription: z
    .string()
    .max(LIMITS.jobDescription.max, "Descrição muito longa")
    .optional(),
});

const skillScoreSchema = z.object({
  skill: z.string().max(LIMITS.keywordItem.max),
  score: z.number().int().min(0).max(100).optional().default(0),
  present: z.boolean().optional().default(false),
  suggestion: z.string().max(300).optional().default(""),
});

const atsSchema = z.object({
  score: z.number().int().min(0).max(100).optional().default(0),
  summary: z.string().max(2000).optional().default(""),
  strengths: z.array(z.string().max(300)).max(10).optional().default([]),
  missingKeywords: z
    .array(z.string().max(LIMITS.keywordItem.max))
    .max(LIMITS.keywordsArray.max)
    .optional()
    .default([]),
  formattingIssues: z.array(z.string().max(300)).max(10).optional().default([]),
  recommendations: z
    .array(z.string().max(LIMITS.recommendationItem.max))
    .max(LIMITS.recommendationsArray.max)
    .optional()
    .default([]),
  skillScores: z.array(skillScoreSchema).max(20).optional().default([]),
});

export type AtsAnalysis = z.infer<typeof atsSchema>;

export interface AtsResult {
  heuristics: AtsHeuristic;
  analysis: AtsAnalysis;
  cached: boolean;
}

const PROMPT = ATS_ANALYZER_PROMPT;

export interface AnalyzeAtsOptions {
  jobDescription?: string;
  traceId?: string;
}

export async function analyzeAts(
  resumeText: string,
  opts?: AnalyzeAtsOptions,
): Promise<AtsAnalysis> {
  const parsed = inputSchema.safeParse({
    resumeText,
    jobDescription: opts?.jobDescription,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Input inválido");
  }

  const userPrompt = `<resume>
${resumeText}
</resume>${
  opts?.jobDescription
    ? `
<job_description>
${opts.jobDescription}
</job_description>`
    : ""
}`;

  const raw = await llmCall(atsSchema, PROMPT, userPrompt, {
    maxOutputTokens: 3500,
    timeoutMs: 35_000,
    retriesOnTimeout: 1,
    eventName: 'ats_analysis',
    traceId: opts?.traceId,
    timeoutErrorMessage: 'A análise ATS demorou mais que o esperado. Tente novamente em instantes.',
    genericErrorMessage: 'Não foi possível analisar o currículo. Tente novamente.',
    formatLogData: (r) => ({ score: normalizeAnalysis(r).score }),
  });

  return normalizeAnalysis(raw);
}

/** Deduplica keywords e skillScores por forma normalizada (sinônimos/variações). */
function normalizeAnalysis(a: AtsAnalysis): AtsAnalysis {
  const seen = new Set<string>();
  const missingKeywords = (a.missingKeywords ?? []).filter((k) => {
    const key = normalizeKeyword(k);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const skillSeen = new Set<string>();
  const skillScores = (a.skillScores ?? []).filter((s) => {
    const key = normalizeKeyword(s.skill);
    if (!key || skillSeen.has(key)) return false;
    skillSeen.add(key);
    return true;
  });

  return { ...a, missingKeywords, skillScores };
}
