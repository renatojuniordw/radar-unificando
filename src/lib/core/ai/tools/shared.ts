import type { Profile } from "@prisma/client";
import { analyzeJobFit, type JobAnalysis } from "@/lib/core/ai/job-analyzer";
import { JOB_ANALYZER_PROMPT_VERSION } from "@/lib/core/ai/prompts/job-analyzer";
import {
  computeCacheKey,
  getCached,
  saveToCache,
} from "@/lib/core/ai/generated-content-cache";

export const FIT_RANK: Record<JobAnalysis["overallFit"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const JOB_DESCRIPTION_LIMIT = 800;

export interface JobLike {
  title: string;
  company: string;
  type: string;
  location: string;
  link: string;
  postedAt?: string | null;
  description?: string | null;
}

/** Transforma uma vaga em resultado de tool: trunca a descrição e embrulha em conteúdo não confiável. */
export function formatJobResult(j: JobLike) {
  return {
    titulo: j.title,
    empresa: j.company,
    tipo: j.type,
    local: j.location,
    link: j.link,
    publicado: j.postedAt || null,
    descricao: j.description
      ? `<untrusted_content>\n${j.description.slice(0, JOB_DESCRIPTION_LIMIT)}\n</untrusted_content>`
      : "",
  };
}

// Chamadas concorrentes (mesmo usuário+vaga+perfil) aguardam a mesma Promise
// em vez de disparar novas chamadas ao LLM — o cache em `generatedContentCache`
// só é escrito depois que a análise termina, então sem isso, chamadas próximas
// no tempo sempre dão cache-miss.
const inFlightAnalyses = new Map<string, Promise<JobAnalysis>>();

export async function analyzeWithCache(
  userId: string,
  profile: Profile,
  jobTitle: string,
  jobDescription: string,
): Promise<JobAnalysis> {
  const resumeContext = profile.resumeMarkdown || profile.resumeText || "";
  const skills = (profile.skills as string[]) || [];
  const education = (profile.education as string[]) || [];
  const experienceYears = profile.experienceYears || 0;
  const seniority = profile.seniority || "pleno";

  // Sem jobId (vaga vem do MCP ao vivo, não persistida) — usa hash do
  // próprio título+descrição no lugar do jobId na chave de cache.
  const cacheKey = computeCacheKey(JOB_ANALYZER_PROMPT_VERSION, [
    jobTitle,
    jobDescription,
    skills,
    experienceYears,
    seniority,
    education,
    resumeContext,
  ]);

  const cached = await getCached<JobAnalysis>(userId, "fit_analysis", cacheKey);
  if (cached) return cached;

  const dedupeKey = `${userId}:${cacheKey}`;
  const inFlight = inFlightAnalyses.get(dedupeKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const traceId = crypto.randomUUID();
      const analysis = await analyzeJobFit(
        resumeContext,
        jobTitle,
        jobDescription,
        skills,
        experienceYears,
        seniority,
        education,
        traceId,
      );

      await saveToCache(userId, "fit_analysis", cacheKey, analysis);
      return analysis;
    } finally {
      inFlightAnalyses.delete(dedupeKey);
    }
  })();

  inFlightAnalyses.set(dedupeKey, promise);
  return promise;
}
