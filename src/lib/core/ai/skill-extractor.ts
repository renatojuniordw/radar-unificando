import { generate } from './llm-provider';
import { resumeExtractionSchema, type ResumeExtraction } from './extraction-schema';
import { logAiEvent } from './ai-logger';
import { SKILL_EXTRACTOR_PROMPT } from './prompts/skill-extractor';

const EXTRACT_PROMPT = SKILL_EXTRACTOR_PROMPT;

const MAX_RESUME_CHARS = 12000;

export async function extractSkillsFromResume(
  markdownText: string,
  traceId?: string,
): Promise<ResumeExtraction> {
  const start = performance.now();

  try {
    const object = await generate(
      resumeExtractionSchema,
      EXTRACT_PROMPT + '\n\n' + markdownText.slice(0, MAX_RESUME_CHARS),
      { maxOutputTokens: 4000 },
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_extraction', {
      traceId,
      latencyMs: Number(latency),
      skillsCount: object.skills.length,
      experienceYears: object.experienceYears,
      seniority: object.seniority,
      education: object.education,
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('resume_extraction', {
      traceId,
      latencyMs: Number(latency),
      success: false,
      error: message,
    });

    throw new Error(`Não foi possível extrair as skills (${message}). Tente novamente.`);
  }
}
