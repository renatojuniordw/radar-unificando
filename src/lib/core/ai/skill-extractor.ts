import { z } from 'zod';
import { generate } from './llm-provider';
import { resumeExtractionSchema, type ResumeExtraction } from './extraction-schema';
import { logAiEvent } from './ai-logger';

const EXTRACT_PROMPT = `Extraia do currículo abaixo:
- skills: skills técnicas e ferramentas
- experienceYears: anos de experiência (null se não mencionado)
- seniority: junior, pleno, senior, lead, manager ou head (null se indeterminado)
- education: áreas de formação
- markdown: o currículo convertido para markdown limpo (seções com ##, listas com bullets, sem artefatos de PDF)

Responda APENAS com JSON válido, sem explicação:
{"markdown":"...","skills":["x"],"experienceYears":7,"seniority":"senior","education":["y"]}

Currículo:`;

const MAX_RESUME_CHARS = 10000;

export async function extractSkillsFromResume(
  text: string,
  traceId?: string,
): Promise<ResumeExtraction> {
  const start = performance.now();

  try {
    const object = await generate(
      resumeExtractionSchema,
      EXTRACT_PROMPT + '\n\n' + text.slice(0, MAX_RESUME_CHARS),
      { maxOutputTokens: 2000 },
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_extraction', {
      traceId,
      latencyMs: Number(latency),
      skillsCount: object.skills.length,
      experienceYears: object.experienceYears,
      seniority: object.seniority,
      education: object.education,
      markdownLength: object.markdown.length,
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

    throw new Error('Não foi possível extrair as skills. Tente novamente.');
  }
}
