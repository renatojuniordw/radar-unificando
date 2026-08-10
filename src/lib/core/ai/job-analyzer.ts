import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';
import { sanitizeUntrusted } from './shared/sanitize';
import { JOB_ANALYZER_PROMPT } from './prompts/job-analyzer';

// ---------------------------------------------------------------------------
// Limites de input — protegem contra custo/DoS (currículo gigante, vaga
// gigante) e reduzem a superfície de prompt injection (menos texto, menos
// espaço pra esconder instrução maliciosa).
// ---------------------------------------------------------------------------
const LIMITS = {
  resumeText: { min: 30, max: 15000 },
  jobTitle: { max: 300 },
  jobDescription: { max: 8000 },
  skillItem: { max: 80 },
  skillsArray: { max: 60 },
  educationItem: { max: 200 },
  educationArray: { max: 20 },
  seniority: { max: 60 },
} as const;

const inputSchema = z.object({
  resumeText: z.string().min(LIMITS.resumeText.min, 'Currículo muito curto.').max(LIMITS.resumeText.max, 'Currículo excede o tamanho máximo permitido.'),
  jobTitle: z.string().min(1).max(LIMITS.jobTitle.max),
  jobDescription: z.string().min(1).max(LIMITS.jobDescription.max),
  skills: z.array(z.string().max(LIMITS.skillItem.max)).max(LIMITS.skillsArray.max),
  experienceYears: z.number().int().min(0).max(60),
  seniority: z.string().max(LIMITS.seniority.max),
  education: z.array(z.string().max(LIMITS.educationItem.max)).max(LIMITS.educationArray.max),
});

const analysisSchema = z.object({
  matchedSkills: z.array(z.string()).max(100),
  missingSkills: z.array(z.string()).max(100),
  experienceFit: z.enum(['above', 'aligned', 'below']).nullable(),
  experienceNotes: z.string().max(2000),
  seniorityFit: z.enum(['above', 'aligned', 'below']).nullable(),
  educationFit: z.enum(['aligned', 'partial', 'misaligned']).nullable(),
  overallFit: z.enum(['high', 'medium', 'low']),
  summary: z.string().max(2000),
  recommendations: z.array(z.string().max(500)).max(20),
});

export type JobAnalysis = z.infer<typeof analysisSchema>;

const PROMPT = JOB_ANALYZER_PROMPT;

const GENERATE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms),
    ),
  ]);
}

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

  // Validação de input ANTES de montar o prompt — falha rápido, barato, e
  // evita mandar payload gigante ou malformado pro provedor de LLM.
  const parsedInput = inputSchema.safeParse({
    resumeText,
    jobTitle,
    jobDescription,
    skills,
    experienceYears,
    seniority,
    education,
  });

  if (!parsedInput.success) {
    logAiEvent('job_analysis', {
      traceId,
      latencyMs: 0,
      jobTitle: jobTitle?.slice(0, 300),
      success: false,
      error: 'INVALID_INPUT',
    });
    throw new Error('Não foi possível analisar a vaga: dados de entrada inválidos.');
  }

  const safeResume = sanitizeUntrusted(parsedInput.data.resumeText, 'resume');
  const safeJobDescription = sanitizeUntrusted(parsedInput.data.jobDescription, 'job_description');
  const safeJobTitle = sanitizeUntrusted(parsedInput.data.jobTitle, 'job_title');

  const fullPrompt = `${PROMPT}

PERFIL:
- Skills: ${parsedInput.data.skills.join(', ')}
- Experiência: ${parsedInput.data.experienceYears} anos
- Senioridade: ${parsedInput.data.seniority}
- Formação: ${parsedInput.data.education.join(', ')}

<job_title>
${safeJobTitle}
</job_title>

<job_description>
${safeJobDescription}
</job_description>

<resume>
${safeResume}
</resume>`;

  try {
    const object = await withTimeout(
      generate(analysisSchema, fullPrompt, { maxOutputTokens: 2000 }),
      GENERATE_TIMEOUT_MS,
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('job_analysis', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      matchedCount: object.matchedSkills.length,
      missingCount: object.missingSkills.length,
      overallFit: object.overallFit,
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    // Nunca propague err.message pro chamador: pode conter detalhes internos
    // do provedor de LLM (endpoints, chaves parciais, stack). Loga completo
    // internamente, mas o usuário só vê mensagem genérica.
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('job_analysis', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: false,
      error: message,
    });

    throw new Error('Não foi possível analisar a vaga. Tente novamente.');
  }
}