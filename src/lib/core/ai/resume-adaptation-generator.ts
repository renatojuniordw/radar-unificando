import { z } from 'zod';
import { generate } from './llm-provider';
import { logAiEvent } from './ai-logger';
import { sanitizeUntrusted } from './shared/sanitize';
import { RESUME_ADAPTATION_PROMPT } from './prompts/resume-adaptation';

const LIMITS = {
  resumeText: { min: 30, max: 15000 },
  jobTitle: { max: 300 },
  jobDescription: { max: 8000 },
  jobCompany: { max: 300 },
  jobLocation: { max: 300 },
  name: { max: 200 },
  headline: { max: 300 },
  contactItem: { max: 300 },
  summary: { max: 1500 },
  skillItem: { max: 100 },
  skillsArray: { max: 30 },
  role: { max: 200 },
  company: { max: 200 },
  period: { max: 100 },
  bullet: { max: 500 },
  bulletsArray: { max: 8 },
  experienceArray: { max: 10 },
  degree: { max: 300 },
  institution: { max: 300 },
  educationArray: { max: 6 },
  certName: { max: 300 },
  certIssuer: { max: 200 },
  certYear: { max: 50 },
  certificationsArray: { max: 8 },
  language: { max: 100 },
  level: { max: 100 },
  languagesArray: { max: 6 },
} as const;

const inputSchema = z.object({
  resumeText: z
    .string()
    .min(LIMITS.resumeText.min, 'Currículo muito curto.')
    .max(LIMITS.resumeText.max, 'Currículo excede o tamanho máximo permitido.'),
  jobTitle: z
    .string()
    .min(1, 'Título da vaga é obrigatório.')
    .max(LIMITS.jobTitle.max, 'Título da vaga muito longo.'),
  jobDescription: z
    .string()
    .max(LIMITS.jobDescription.max, 'Descrição muito longa.')
    .optional()
    .default(''),
  jobCompany: z
    .string()
    .max(LIMITS.jobCompany.max, 'Nome da empresa muito longo.')
    .optional()
    .default(''),
  jobLocation: z
    .string()
    .max(LIMITS.jobLocation.max, 'Localidade muito longa.')
    .optional()
    .default(''),
});

const resumeSchema = z.object({
  fullName: z.string().max(LIMITS.name.max).optional().default(''),
  headline: z.string().max(LIMITS.headline.max).optional().default(''),
  contact: z
    .object({
      email: z.string().max(LIMITS.contactItem.max).optional(),
      phone: z.string().max(LIMITS.contactItem.max).optional(),
      location: z.string().max(LIMITS.contactItem.max).optional(),
      linkedin: z.string().max(LIMITS.contactItem.max).optional(),
    })
    .optional()
    .default({}),
  summary: z.string().max(LIMITS.summary.max).optional().default(''),
  skills: z.array(z.string().max(LIMITS.skillItem.max)).max(LIMITS.skillsArray.max).optional().default([]),
  experience: z
    .array(
      z.object({
        role: z.string().max(LIMITS.role.max),
        company: z.string().max(LIMITS.company.max),
        period: z.string().max(LIMITS.period.max).optional().default(''),
        bullets: z.array(z.string().max(LIMITS.bullet.max)).max(LIMITS.bulletsArray.max).optional().default([]),
      }),
    )
    .max(LIMITS.experienceArray.max)
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().max(LIMITS.degree.max),
        institution: z.string().max(LIMITS.institution.max),
        period: z.string().max(LIMITS.period.max).optional().default(''),
      }),
    )
    .max(LIMITS.educationArray.max)
    .optional()
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().max(LIMITS.certName.max),
        issuer: z.string().max(LIMITS.certIssuer.max).optional().default(''),
        year: z.string().max(LIMITS.certYear.max).optional().default(''),
      }),
    )
    .max(LIMITS.certificationsArray.max)
    .optional()
    .default([]),
  languages: z
    .array(
      z.object({
        language: z.string().max(LIMITS.language.max),
        level: z.string().max(LIMITS.level.max).optional().default(''),
      }),
    )
    .max(LIMITS.languagesArray.max)
    .optional()
    .default([]),
});

export type AdaptedResume = z.infer<typeof resumeSchema>;

const GENERATE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms),
    ),
  ]);
}

export interface GenerateAdaptedResumeOptions {
  jobCompany?: string;
  jobLocation?: string;
  traceId?: string;
}

export async function generateAdaptedResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  opts?: GenerateAdaptedResumeOptions,
): Promise<AdaptedResume> {
  const start = performance.now();

  const parsedInput = inputSchema.safeParse({
    resumeText,
    jobTitle,
    jobDescription,
    jobCompany: opts?.jobCompany,
    jobLocation: opts?.jobLocation,
  });

  if (!parsedInput.success) {
    logAiEvent('resume_adaptation', {
      traceId: opts?.traceId,
      latencyMs: 0,
      jobTitle: jobTitle?.slice(0, 300),
      success: false,
      error: 'INVALID_INPUT',
    });
    throw new Error(parsedInput.error.issues[0]?.message || 'Dados de entrada inválidos.');
  }

  const { resumeText: safeResume, jobTitle: safeJobTitle, jobDescription: safeJobDescription } = parsedInput.data;
  const safeCompany = sanitizeUntrusted(parsedInput.data.jobCompany, 'job_company');
  const safeLocation = sanitizeUntrusted(parsedInput.data.jobLocation, 'job_location');

  const companyBlock = safeCompany ? `\n<job_company>\n${safeCompany}\n</job_company>` : '';
  const locationBlock = safeLocation ? `\n<job_location>\n${safeLocation}\n</job_location>` : '';

  const fullPrompt = `${RESUME_ADAPTATION_PROMPT}

<job_title>
${safeJobTitle}
</job_title>

<job_description>
${safeJobDescription}
</job_description>${companyBlock}${locationBlock}

<resume>
${safeResume}
</resume>`;

  try {
    const object = await withTimeout(
      generate(resumeSchema, fullPrompt, { maxOutputTokens: 3000 }),
      GENERATE_TIMEOUT_MS,
    );

    const latency = (performance.now() - start).toFixed(0);
    logAiEvent('resume_adaptation', {
      traceId: opts?.traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: true,
    });

    return object;
  } catch (err) {
    const latency = (performance.now() - start).toFixed(0);
    const message = err instanceof Error ? err.message : String(err);
    logAiEvent('resume_adaptation', {
      traceId: opts?.traceId,
      latencyMs: Number(latency),
      jobTitle: safeJobTitle.slice(0, 300),
      success: false,
      error: message,
    });

    throw new Error('Não foi possível gerar o currículo adaptado. Tente novamente.');
  }
}

/** Converte o currículo estruturado em markdown (função pura — sem imports node). */
export function adaptedResumeToMarkdown(resume: AdaptedResume): string {
  const lines: string[] = [];

  if (resume.fullName) lines.push(`# ${resume.fullName}`);
  if (resume.headline) lines.push(resume.headline);

  const contactParts = [
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    resume.contact?.linkedin,
  ].filter(Boolean);
  if (contactParts.length > 0) lines.push(contactParts.join(' · '));

  if (resume.summary) {
    lines.push('', '## Resumo', resume.summary);
  }

  if (resume.skills.length > 0) {
    lines.push('', '## Habilidades', resume.skills.join(', '));
  }

  if (resume.experience.length > 0) {
    lines.push('', '## Experiência');
    for (const exp of resume.experience) {
      const header = [exp.role, exp.company].filter(Boolean).join(' — ');
      const period = exp.period ? ` (${exp.period})` : '';
      lines.push(`### ${header}${period}`);
      for (const bullet of exp.bullets) lines.push(`- ${bullet}`);
    }
  }

  if (resume.education.length > 0) {
    lines.push('', '## Formação');
    for (const edu of resume.education) {
      const parts = [edu.degree, edu.institution, edu.period].filter(Boolean);
      lines.push(`- ${parts.join(' — ')}`);
    }
  }

  if (resume.certifications.length > 0) {
    lines.push('', '## Certificações');
    for (const cert of resume.certifications) {
      const parts = [cert.name, cert.issuer, cert.year].filter(Boolean);
      lines.push(`- ${parts.join(' — ')}`);
    }
  }

  if (resume.languages.length > 0) {
    lines.push('', '## Idiomas');
    for (const lang of resume.languages) {
      const parts = [lang.language, lang.level].filter(Boolean);
      lines.push(`- ${parts.join(' — ')}`);
    }
  }

  return lines.join('\n');
}