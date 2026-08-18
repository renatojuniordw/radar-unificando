// ---------------------------------------------------------------------------
// Serviço de análise ATS: combina heurísticas determinísticas (custo zero) com
// o score LLM, cacheando por versão do currículo + vaga alvo.
// ---------------------------------------------------------------------------

import { computeCacheKey, getCached, saveToCache } from '../generated-content-cache';
import { ATS_ANALYZER_PROMPT_VERSION } from '../prompts/ats-analyzer';
import { analyzeAts, type AtsAnalysis } from './ats-analyzer';
import { analyzeAtsHeuristics, type AtsHeuristic } from './ats-heuristics';

export interface AtsServiceResult {
  heuristics: AtsHeuristic;
  analysis: AtsAnalysis;
  cached: boolean;
}

export interface AnalyzeAtsWithCacheOptions {
  jobDescription?: string;
  /** Identificador da vaga (id ou hash de title+company) — evita colisão de cache entre vagas com descrição vazia/idêntica. */
  jobKey?: string;
  traceId?: string;
}

// Chamadas concorrentes (mesmo usuário+currículo+vaga) aguardam a mesma
// Promise em vez de disparar novas chamadas ao LLM — o cache só é escrito
// depois que a análise termina, então sem isso, chamadas próximas no tempo
// (ex: analyze_ats_score e generate_resume no mesmo turno) sempre dão miss.
const inFlightAnalyses = new Map<string, Promise<AtsAnalysis>>();

export async function analyzeAtsWithCache(
  userId: string,
  resumeText: string,
  opts?: AnalyzeAtsWithCacheOptions,
): Promise<AtsServiceResult> {
  const heuristics = analyzeAtsHeuristics(resumeText);

  const cacheKey = computeCacheKey(ATS_ANALYZER_PROMPT_VERSION, [
    resumeText,
    opts?.jobDescription || '',
    opts?.jobKey || '',
  ]);
  const cached = await getCached<AtsAnalysis>(userId, 'ats_analysis', cacheKey);
  if (cached) return { heuristics, analysis: cached, cached: true };

  const dedupeKey = `${userId}:${cacheKey}`;
  const inFlight = inFlightAnalyses.get(dedupeKey);
  if (inFlight) return { heuristics, analysis: await inFlight, cached: false };

  const promise = (async () => {
    try {
      const analysis = await analyzeAts(resumeText, opts);
      await saveToCache(userId, 'ats_analysis', cacheKey, analysis);
      return analysis;
    } finally {
      inFlightAnalyses.delete(dedupeKey);
    }
  })();

  inFlightAnalyses.set(dedupeKey, promise);
  return { heuristics, analysis: await promise, cached: false };
}
