import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';
import { sanitizeAnalysisInput } from './shared/sanitize-analysis-input';
import { INTERVIEW_QUESTIONS_PROMPT } from './prompts/interview-questions';

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms),
    ),
  ]);
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  matchedSkills: string[],
  missingSkills: string[],
  traceId?: string,
): Promise<InterviewQuestions> {
  const start = performance.now();

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

  const fullPrompt = `${PROMPT}

MATCHED_SKILLS: ${parsedInput.data.matchedSkills.join(', ') || 'nenhuma identificada'}
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

  try {
    const object = await withTimeout(
      generate(questionsSchema, fullPrompt, { maxOutputTokens: 1800 }),
      GENERATE_TIMEOUT_MS,
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('interview_questions_generation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      questionCount: object.questions.length,
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('interview_questions_generation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: false,
      error: message,
    });

    throw new Error('Não foi possível gerar as perguntas de entrevista. Tente novamente.');
  }
}
