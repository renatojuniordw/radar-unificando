import { z } from 'zod';
import { logAiEvent } from './ai-logger';
import { sanitizeAnalysisInput } from './shared/sanitize-analysis-input';
import { INTERVIEW_QUESTIONS_PROMPT } from './prompts/interview-questions';
import { llmCall } from './shared/llm-call';

const LIMITS = {
  resumeText: { min: 30, max: 15000 },
  jobTitle: { max: 300 },
  jobDescription: { max: 8000 },
  skillItem: { max: 80 },
  skillsArray: { max: 60 },
} as const;

const inputSchema = z.object({
  resumeText: z.string().min(LIMITS.resumeText.min, 'Currículo muito curto.').max(LIMITS.resumeText.max, 'Currículo excede o tamanho máximo permitido.'),
  jobTitle: z.string().min(1).max(LIMITS.jobTitle.max),
  jobDescription: z.string().min(1).max(LIMITS.jobDescription.max),
  matchedSkills: z.array(z.string().max(LIMITS.skillItem.max)).max(LIMITS.skillsArray.max),
  missingSkills: z.array(z.string().max(LIMITS.skillItem.max)).max(LIMITS.skillsArray.max),
});

const questionsSchema = z.object({
  questions: z.array(z.object({
    question: z.string().max(400),
    category: z.enum(['technical', 'behavioral', 'gap']),
    rationale: z.string().max(300),
  })).max(8),
});

export type InterviewQuestions = z.infer<typeof questionsSchema>;

const PROMPT = INTERVIEW_QUESTIONS_PROMPT;

const GENERATE_TIMEOUT_MS = 20_000;

export async function generateInterviewQuestions(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  matchedSkills: string[],
  missingSkills: string[],
  traceId?: string,
): Promise<InterviewQuestions> {
  const parsedInput = inputSchema.safeParse({ resumeText, jobTitle, jobDescription, matchedSkills, missingSkills });

  if (!parsedInput.success) {
    logAiEvent('interview_questions_generation', {
      traceId,
      latencyMs: 0,
      jobTitle: jobTitle?.slice(0, 300),
      success: false,
      error: 'INVALID_INPUT',
    });
    throw new Error('Não foi possível gerar as perguntas: dados de entrada inválidos.');
  }

  const { safeResume, safeJobDescription, safeJobTitle } = sanitizeAnalysisInput(parsedInput.data);

  const userPrompt = `MATCHED_SKILLS: ${parsedInput.data.matchedSkills.join(', ') || 'nenhuma identificada'}
MISSING_SKILLS: ${parsedInput.data.missingSkills.join(', ') || 'nenhuma identificada'}

<job_title>
${safeJobTitle}
</job_title>

<job_description>
${safeJobDescription}
</job_description>

<resume>
${safeResume}
</resume>`;

  return llmCall(questionsSchema, PROMPT, userPrompt, {
    maxOutputTokens: 1800,
    timeoutMs: GENERATE_TIMEOUT_MS,
    eventName: 'interview_questions_generation',
    traceId,
    timeoutErrorMessage: 'A geração das perguntas demorou mais que o esperado. Tente novamente em instantes.',
    genericErrorMessage: 'Não foi possível gerar as perguntas de entrevista. Tente novamente.',
    logData: { jobTitle: safeJobTitle.slice(0, 300) },
    formatLogData: (r) => ({ questionCount: r.questions.length }),
  });
}
