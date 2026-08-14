import { sanitizeUntrusted } from './sanitize';

export interface AnalysisInput {
  resumeText: string;
  jobDescription?: string;
  jobTitle?: string;
}

export interface SanitizedAnalysisInput {
  safeResume: string;
  safeJobDescription: string;
  safeJobTitle: string;
}

/** Sanitiza os campos de entrada comuns a todos os geradores de IA. */
export function sanitizeAnalysisInput(input: AnalysisInput): SanitizedAnalysisInput {
  return {
    safeResume: sanitizeUntrusted(input.resumeText, 'resume'),
    safeJobDescription: sanitizeUntrusted(input.jobDescription || '', 'job_description'),
    safeJobTitle: sanitizeUntrusted(input.jobTitle || '', 'job_title'),
  };
}
