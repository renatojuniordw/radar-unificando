// ---------------------------------------------------------------------------
// Serviço de análise ATS: combina heurísticas determinísticas (custo zero) com
// o score LLM, cacheando por versão do currículo + vaga alvo.
// ---------------------------------------------------------------------------

import { computeCacheKey, getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';
import { ATS_ANALYZER_PROMPT_VERSION } from '@/lib/core/ai/prompts/ats-analyzer';
import { analyzeAts, type AtsAnalysis } from './ats-analyzer';
import { analyzeAtsHeuristics, type AtsHeuristic } from './ats-heuristics';

export interface AtsServiceResult {
  heuristics: AtsHeuristic;
  analysis: AtsAnalysis;
  cached: boolean;
}

export interface AnalyzeAtsWithCacheOptions {
  jobDescription?: string;
  traceId?: string;
}

export async function analyzeAtsWithCache(
  userId: string,
  resumeText: string,
  opts?: AnalyzeAtsWithCacheOptions,
): Promise<AtsServiceResult> {
  const heuristics = analyzeAtsHeuristics(resumeText);

  const cacheKey = computeCacheKey(ATS_ANALYZER_PROMPT_VERSION, [
    resumeText,
    opts?.jobDescription || '',
  ]);
  const cached = await getCached<AtsAnalysis>(userId, 'ats_analysis', cacheKey);
  if (cached) return { heuristics, analysis: cached, cached: true };

  const analysis = await analyzeAts(resumeText, opts);
  await saveToCache(userId, 'ats_analysis', cacheKey, analysis);
  return { heuristics, analysis, cached: false };
}
