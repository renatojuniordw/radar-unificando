// ---------------------------------------------------------------------------
// Análise ATS via LLM — score 0-100 + pontos fortes + keywords faltando +
// problemas de formatação + recomendações. Segue o padrão do job-analyzer:
// schema Zod + generate() + prompt com regras de segurança (dados vs instruções).
// ---------------------------------------------------------------------------

import { z } from "zod";
import { generate } from "../llm-provider";
import { logAiEvent } from "../ai-logger";
import { normalizeKeyword } from "./normalize";
import { ATS_ANALYZER_PROMPT } from "../prompts/ats-analyzer";

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

const PROMPT = ATS_ANALYZER_PROMPT;

const GENERATE_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timerId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timerId = setTimeout(() => reject(new Error("LLM_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

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

  const prompt = `${PROMPT}

<resume>
${resumeText}
</resume>
${
  opts?.jobDescription
    ? `
<job_description>
${opts.jobDescription}
</job_description>`
    : ""
}`;

  const runAnalysis = () =>
    withTimeout(
      generate(atsSchema, prompt, { maxOutputTokens: 3500 }),
      GENERATE_TIMEOUT_MS,
    );

  const logSuccess = (raw: AtsAnalysis, retried: boolean) => {
    const analysis = normalizeAnalysis(raw);
    logAiEvent("ats_analysis", {
      traceId: opts?.traceId,
      score: analysis.score,
      success: true,
      ...(retried ? { retried: true } : {}),
    });
    return analysis;
  };

  // Nunca propague err.message pro chamador: pode conter detalhes internos do
  // provedor de LLM (endpoints, chaves parciais, stack). Loga completo
  // internamente, mas quem chama só vê mensagem genérica (diferenciada por causa).
  const handleFailure = (err: unknown, wasTimeout: boolean): never => {
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent("ats_analysis", {
      traceId: opts?.traceId,
      success: false,
      error: message,
    });
    throw new Error(
      wasTimeout
        ? "A análise ATS demorou mais que o esperado. Tente novamente em instantes."
        : "Não foi possível analisar o currículo. Tente novamente.",
    );
  };

  try {
    const raw = await runAnalysis();
    return logSuccess(raw, false);
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "LLM_TIMEOUT";
    if (!isTimeout) return handleFailure(err, false);

    // 1 retry específico para timeout, antes de desistir.
    try {
      const raw = await runAnalysis();
      return logSuccess(raw, true);
    } catch (retryErr) {
      const retryIsTimeout = retryErr instanceof Error && retryErr.message === "LLM_TIMEOUT";
      return handleFailure(retryErr, retryIsTimeout);
    }
  }
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
