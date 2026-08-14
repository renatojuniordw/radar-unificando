import { createHash } from 'node:crypto';

/** Hash SHA-256 do currículo normalizado — usado para detectar contas duplicadas (anti multi-conta). */
export function computeResumeHash(
  resumeText: string | null | undefined,
  resumeMarkdown: string | null | undefined,
): string | null {
  const raw = `${resumeText ?? ''}|${resumeMarkdown ?? ''}`.trim();
  if (!raw || raw === '|') return null;
  return createHash('sha256').update(raw).digest('hex');
}
