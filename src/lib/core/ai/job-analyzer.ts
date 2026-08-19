import { z } from 'zod';
import { logAiEvent } from './ai-logger';
import { sanitizeAnalysisInput } from './shared/sanitize-analysis-input';
import { sanitizeUntrusted } from './shared/sanitize';
import { JOB_ANALYZER_PROMPT } from './prompts/job-analyzer';
import { llmCall } from './shared/llm-call';

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

  const { safeResume, safeJobDescription, safeJobTitle } = sanitizeAnalysisInput(parsedInput.data);

  // Skills/senioridade/formação vêm do perfil do usuário (texto livre) — sanitizar
  // e delimitar como <profile> evita que sejam interpretados como instrução.
  const safeSkills = parsedInput.data.skills.map((s) => sanitizeUntrusted(s, 'profile')).join(', ');
  const safeSeniority = sanitizeUntrusted(parsedInput.data.seniority, 'profile');
  const safeEducation = parsedInput.data.education.map((e) => sanitizeUntrusted(e, 'profile')).join(', ');

  const userPrompt = `<profile>
- Skills: ${safeSkills}
- Experiência: ${parsedInput.data.experienceYears} anos
- Senioridade: ${safeSeniority}
- Formação: ${safeEducation}
</profile>

<job_title>
${safeJobTitle}
</job_title>

<job_description>
${safeJobDescription}
</job_description>

<resume>
${safeResume}
</resume>`;

  return llmCall(analysisSchema, PROMPT, userPrompt, {
    maxOutputTokens: 3500,
    timeoutMs: 35_000,
    retriesOnTimeout: 1,
    eventName: 'job_analysis',
    traceId,
    timeoutErrorMessage: 'A análise da vaga demorou mais que o esperado. Tente novamente em instantes.',
    genericErrorMessage: 'Não foi possível analisar a vaga. Tente novamente.',
    logData: { jobTitle: safeJobTitle.slice(0, 300) },
    formatLogData: (result) => ({
      matchedCount: result.matchedSkills.length,
      missingCount: result.missingSkills.length,
      overallFit: result.overallFit,
    }),
  });
}