import { generate } from './llm-provider';
import { resumeExtractionSchema, type ResumeExtraction } from './extraction-schema';
import { logAiEvent } from './ai-logger';
import {
  SKILL_EXTRACTOR_SYSTEM_PROMPT,
  SKILL_EXTRACTOR_USER_PROMPT,
} from './prompts/skill-extractor';
import { isLlmTimeout } from './shared/with-timeout';

const MAX_RESUME_CHARS = 8000;
const FIRST_ATTEMPT_TOKENS = 12000;
const RETRY_ATTEMPT_TOKENS = 16000;
const FIRST_ATTEMPT_TIMEOUT_MS = 30_000;
const RETRY_TIMEOUT_MS = 30_000;

export async function extractSkillsFromResume(
  markdownText: string,
  traceId?: string,
): Promise<ResumeExtraction> {
  const start = performance.now();
  const resumeText = markdownText.slice(0, MAX_RESUME_CHARS);
  const userPrompt = SKILL_EXTRACTOR_USER_PROMPT.replace('{{RESUME_TEXT}}', resumeText);

  // 1ª tentativa: system message + timeout curto
  try {
    const object = await generate(
      resumeExtractionSchema,
      { system: SKILL_EXTRACTOR_SYSTEM_PROMPT, user: userPrompt },
      { maxOutputTokens: FIRST_ATTEMPT_TOKENS, timeoutMs: FIRST_ATTEMPT_TIMEOUT_MS },
    );
    logSuccess(object, false, traceId, start);
    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_extraction', {
      traceId,
      latencyMs: Number(latency),
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });

    // Retry em timeout ou token limit — outros erros são propagados diretamente
    const shouldRetry = isLlmTimeout(err) || (err instanceof Error && err.message === 'LLM_TOKEN_LIMIT');
    if (!shouldRetry) {
      throw new Error(`Não foi possível extrair as skills. Tente novamente.`);
    }
  }

  // 2ª tentativa: system message reforçado + mais tokens + timeout curto
  try {
    const object = await generate(
      resumeExtractionSchema,
      {
        system: SKILL_EXTRACTOR_SYSTEM_PROMPT + '\n\nCRITICAL: The FIRST character of your response MUST be "{". Do NOT write anything before the JSON.',
        user: userPrompt,
      },
      { maxOutputTokens: RETRY_ATTEMPT_TOKENS, timeoutMs: RETRY_TIMEOUT_MS },
    );
    logSuccess(object, true, traceId, start);
    return object;
  } catch (retryErr) {
    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_extraction', {
      traceId,
      latencyMs: Number(latency),
      success: false,
      error: retryErr instanceof Error ? retryErr.message : String(retryErr),
    });
    throw new Error(`Não foi possível extrair as skills. Tente novamente.`);
  }
}

function logSuccess(object: ResumeExtraction, isRetry: boolean, traceId?: string, start?: number) {
  const latency = start ? (performance.now() - start).toFixed(0) : '0';
  logAiEvent('resume_extraction', {
    traceId,
    latencyMs: Number(latency),
    skillsCount: object.skills.length,
    experienceYears: object.experienceYears,
    seniority: object.seniority,
    education: object.education,
    extractionError: object.extractionError,
    success: !object.extractionError,
    retry: isRetry,
  });
}
