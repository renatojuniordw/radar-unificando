import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';
import { sanitizeUntrusted } from './shared/sanitize';
import { COVER_LETTER_PROMPT } from './prompts/cover-letter';

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
  skills: z.array(z.string().max(LIMITS.skillItem.max)).max(LIMITS.skillsArray.max),
});

const coverLetterSchema = z.object({
  letter: z.string().max(3000),
  keyPoints: z.array(z.string().max(300)).max(10),
});

export type CoverLetter = z.infer<typeof coverLetterSchema>;

const PROMPT = COVER_LETTER_PROMPT;

const GENERATE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms),
    ),
  ]);
}

export async function generateCoverLetter(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  skills: string[],
  traceId?: string,
): Promise<CoverLetter> {
  const start = performance.now();

  const parsedInput = inputSchema.safeParse({ resumeText, jobTitle, jobDescription, skills });

  if (!parsedInput.success) {
    logAiEvent('cover_letter_generation', {
      traceId,
      latencyMs: 0,
      jobTitle: jobTitle?.slice(0, 300),
      success: false,
      error: 'INVALID_INPUT',
    });
    throw new Error('Não foi possível gerar a carta: dados de entrada inválidos.');
  }

  const safeResume = sanitizeUntrusted(parsedInput.data.resumeText, 'resume');
  const safeJobDescription = sanitizeUntrusted(parsedInput.data.jobDescription, 'job_description');
  const safeJobTitle = sanitizeUntrusted(parsedInput.data.jobTitle, 'job_title');

  const fullPrompt = `${PROMPT}

SKILLS DO CANDIDATO: ${parsedInput.data.skills.join(', ')}

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
      generate(coverLetterSchema, fullPrompt, { maxOutputTokens: 1500 }),
      GENERATE_TIMEOUT_MS,
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('cover_letter_generation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('cover_letter_generation', {
      traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: false,
      error: message,
    });

    throw new Error('Não foi possível gerar a carta de apresentação. Tente novamente.');
  }
}
