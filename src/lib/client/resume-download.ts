// Utils client-side para download do currículo adaptado (usa atob/document — só cliente).

import { slugify } from '@/lib/core/vagas/slug';

export interface ResumeJobInput {
  title: string;
  company: string;
  description?: string;
  location?: string;
}

export interface ResumeProgressStep {
  step: number;
  totalSteps: number;
  message: string;
  progressPercent: number;
}

export type ProgressCallback = (stepInfo: ResumeProgressStep) => void;

/** Chave composta para identificar uma vaga (para estado de loading). */
export function jobKey(job: ResumeJobInput): string {
  return `${job.company}|${job.title}`;
}

// Rota encadeia análise ATS (pior caso ~70s, 2x35s) + geração do currículo
// (pior caso ~40s, 2x20s) + render de PDF. O timeout do cliente precisa
// ficar acima da soma dos dois piores casos.
const FETCH_TIMEOUT_MS = 150_000;

/**
 * Gera o currículo adaptado no servidor e baixa o PDF diretamente.
 * Lança Error com mensagem amigável em caso de falha.
 */
export async function downloadAdaptedResume(
  job: ResumeJobInput,
  onProgress?: ProgressCallback,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  onProgress?.({
    step: 1,
    totalSteps: 3,
    message: "Analisando requisitos da vaga e palavras-chave ATS...",
    progressPercent: 20,
  });

  const t1 = setTimeout(() => {
    onProgress?.({
      step: 2,
      totalSteps: 3,
      message: "Adaptando e otimizando experiências profissionais com IA...",
      progressPercent: 55,
    });
  }, 5000);

  const t2 = setTimeout(() => {
    onProgress?.({
      step: 3,
      totalSteps: 3,
      message: "Validando veracidade e compilando documento PDF...",
      progressPercent: 85,
    });
  }, 18000);

  let res: Response;
  try {
    res = await fetch("/api/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        jobTitle: job.title,
        jobDescription: job.description || "",
        jobCompany: job.company,
        jobLocation: job.location || "",
      }),
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    throw new Error(
      isTimeout
        ? "A geração está demorando mais que o esperado. Tente novamente em instantes."
        : "Erro de conexão. Tente novamente.",
    );
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(t1);
    clearTimeout(t2);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Erro ao gerar o currículo.");
  }

  onProgress?.({
    step: 3,
    totalSteps: 3,
    message: "Currículo confeccionado com sucesso! Download iniciado.",
    progressPercent: 100,
  });

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

/**
 * Gera o currículo adaptado no servidor e baixa o arquivo .docx (Microsoft Word).
 */
export async function downloadAdaptedResumeDocx(
  job: ResumeJobInput,
  onProgress?: ProgressCallback,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  onProgress?.({
    step: 1,
    totalSteps: 3,
    message: "Analisando requisitos da vaga e palavras-chave ATS...",
    progressPercent: 20,
  });

  const t1 = setTimeout(() => {
    onProgress?.({
      step: 2,
      totalSteps: 3,
      message: "Adaptando e otimizando experiências profissionais com IA...",
      progressPercent: 55,
    });
  }, 5000);

  const t2 = setTimeout(() => {
    onProgress?.({
      step: 3,
      totalSteps: 3,
      message: "Validando veracidade e gerando arquivo Word (DOCX)...",
      progressPercent: 85,
    });
  }, 18000);

  let res: Response;
  try {
    res = await fetch("/api/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        jobTitle: job.title,
        jobDescription: job.description || "",
        jobCompany: job.company,
        jobLocation: job.location || "",
      }),
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    throw new Error(
      isTimeout
        ? "A geração está demorando mais que o esperado. Tente novamente em instantes."
        : "Erro de conexão. Tente novamente.",
    );
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(t1);
    clearTimeout(t2);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Erro ao gerar o currículo.");
  }

  onProgress?.({
    step: 3,
    totalSteps: 3,
    message: "Currículo confeccionado com sucesso! Download Word iniciado.",
    progressPercent: 100,
  });

  const { renderResumeDocx } = await import("@/lib/docx/render-resume-docx");
  const blob = await renderResumeDocx(data.resume);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `curriculo-${slugify(job.title)}-${slugify(job.company)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}