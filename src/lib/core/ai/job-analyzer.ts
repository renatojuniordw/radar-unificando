import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';

const analysisSchema = z.object({
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceFit: z.enum(['above', 'aligned', 'below']).nullable(),
  experienceNotes: z.string(),
  seniorityFit: z.enum(['above', 'aligned', 'below']).nullable(),
  educationFit: z.enum(['aligned', 'partial', 'misaligned']).nullable(),
  overallFit: z.enum(['high', 'medium', 'low']),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type JobAnalysis = z.infer<typeof analysisSchema>;

const PROMPT = `Analise o fit entre o candidato e a vaga. Seja específico e honesto.

Responda APENAS com JSON válido:
{
  "matchedSkills": ["skill que bate"],
  "missingSkills": ["skill que falta"],
  "experienceFit": "above"|"aligned"|"below"|null,
  "experienceNotes": "curto texto sobre experiência",
  "seniorityFit": "above"|"aligned"|"below"|null,
  "educationFit": "aligned"|"partial"|"misaligned"|null,
  "overallFit": "high"|"medium"|"low",
  "summary": "parágrafo curto do fit",
  "recommendations": ["ação1"]
}`;

export async function analyzeJobFit(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  skills: string[],
  experienceYears: number,
  seniority: string,
  education: string[],
  traceId?: string,
): Promise<JobAnalysis> {
  const start = performance.now();

  const fullPrompt = `${PROMPT}

PERFIL:
- Skills: ${skills.join(', ')}
- Experiência: ${experienceYears} anos
- Senioridade: ${seniority}
- Formação: ${education.join(', ')}

VAGA:
Título: ${jobTitle}
Descrição: ${jobDescription}

CURRÍCULO:
${resumeText}`;

  try {
    const object = await generate(analysisSchema, fullPrompt, { maxOutputTokens: 2000 });

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('job_analysis', {
      traceId,
      latencyMs: Number(latency),
      jobTitle,
      matchedCount: object.matchedSkills.length,
      missingCount: object.missingSkills.length,
      overallFit: object.overallFit,
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('job_analysis', {
      traceId,
      latencyMs: Number(latency),
      jobTitle,
      success: false,
      error: message,
    });

    throw new Error('Não foi possível analisar a vaga. Tente novamente.');
  }
}
