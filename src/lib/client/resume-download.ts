// Utils client-side para download do currículo adaptado (usa atob/document — só cliente).

import { slugify } from '@/lib/core/vagas/slug';

export interface ResumeJobInput {
  title: string;
  company: string;
  description?: string;
  location?: string;
}

/** Chave composta para identificar uma vaga (para estado de loading). */
export function jobKey(job: ResumeJobInput): string {
  return `${job.company}|${job.title}`;
}

/**
 * Gera o currículo adaptado no servidor e baixa o PDF diretamente.
 * Lança Error com mensagem amigável em caso de falha.
 */
export async function downloadAdaptedResume(job: ResumeJobInput): Promise<void> {
  const res = await fetch("/api/resume/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle: job.title,
      jobDescription: job.description || "",
      jobCompany: job.company,
      jobLocation: job.location || "",
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Erro ao gerar o currículo.");
  }

  const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `curriculo-${slugify(job.title)}-${slugify(job.company)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}