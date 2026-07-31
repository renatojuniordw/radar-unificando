import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';

const adaptSchema = z.object({
  resume: z.string(),
  highlights: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

const PROMPT = `Adapte o currículo para a vaga específica. Destaque skills e experiências mais relevantes.
Use tom profissional e mantenha as informações verdadeiras.

Responda APENAS com JSON válido:
{
  "resume": "currículo adaptado em markdown",
  "highlights": ["ponto forte 1"],
  "missingSkills": ["skill que seria diferencial"]
}`;

export async function adaptResumeForJob(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  skills: string[],
  experienceYears: number,
  seniority: string,
  education: string[],
  traceId?: string,
): Promise<{ resume: string; highlights: string[]; missingSkills: string[] }> {
  const start = performance.now();

  const fullPrompt = `${PROMPT}

CURRÍCULO ORIGINAL:
${resumeText}

VAGA: ${jobTitle}
DESCRIÇÃO: ${jobDescription}

PERFIL:
- Skills: ${skills.join(', ')}
- Experiência: ${experienceYears} anos
- Senioridade: ${seniority}
- Formação: ${education.join(', ')}`;

  try {
    const object = await generate(adaptSchema, fullPrompt, { maxOutputTokens: 3000 });

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_adaptation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle,
      highlightsCount: object.highlights.length,
      missingSkillsCount: object.missingSkills.length,
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('resume_adaptation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle,
      success: false,
      error: message,
    });

    throw new Error('Não foi possível adaptar o currículo. Tente novamente.');
  }
}
