import { tool } from "ai";
import { z } from "zod";
import { gupyMcpClient } from "@/lib/core/mcp/gupy-client";
import { jobLinkFilter } from "@/lib/core/pipeline/job-link-filter";
import { debugLog } from "@/lib/utils/debug";
import { formatJobResult } from "./shared";

const MAX_SEARCHES_PER_MESSAGE = 2;

const MODALITY_QUALIFIERS_RE =
  /\b(remot[oa]|h[ií]brid[oa]|presencial|home\s+office)\b/giu;

/**
 * Remove qualificadores de modalidade (remoto/híbrido/presencial) da query.
 * A Gupy indexa esses valores no campo workplaceType, não no título da vaga —
 * deixá-los na busca textual zera resultados que existem (ver log de bug:
 * "Software Engineer Remoto" -> 0 vagas vs "Software Engineer" -> 20 vagas).
 */
function stripModalityQualifiers(query: string): string {
  const stripped = query.replace(MODALITY_QUALIFIERS_RE, " ").replace(/\s+/g, " ").trim();
  return stripped.length >= 2 ? stripped : query;
}

export function createSearchJobsTool(_userId: string) {
  let searchCount = 0;

  return tool({
    description:
      "Buscar vagas no Gupy usando uma query de texto. Use palavras-chave como cargo, empresa, ou tecnologia. O resultado inclui a descrição e a data de publicação de cada vaga (quando disponível) — use a descrição diretamente em analyze_job_fit, sem precisar de outra busca, e mencione/priorize vagas mais recentes quando isso for relevante para a pergunta do usuário.",
    inputSchema: z.object({
      query: z
        .string()
        .min(2, "Query muito curta")
        .max(200, "Query muito longa")
        .regex(/^[\p{L}\p{N}\s\-_.]+$/u, "Caracteres não permitidos na query")
        .describe('Termo de busca (ex: "Data Analyst", "Python", "Nubank")'),
      limit: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(10)
        .describe("Máximo de resultados (até 20)"),
    }),
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      searchCount++;
      if (searchCount > MAX_SEARCHES_PER_MESSAGE) {
        return {
          error:
            "Limite de 2 buscas por mensagem atingido. Reformule o pedido.",
        };
      }
      const sanitizedQuery = stripModalityQualifiers(query);
      debugLog(
        `[chat-tools] search_jobs chamado com query="${query}"${sanitizedQuery !== query ? ` (sanitizada para "${sanitizedQuery}")` : ""} limit=${limit}`,
      );
      const jobs = await gupyMcpClient.searchJobs(
        sanitizedQuery,
        Math.min((limit || 10) * 2, 40),
      );
      const aliveJobs = await jobLinkFilter.filterAlive(jobs, {
        concurrency: 5,
      });
      return aliveJobs.slice(0, limit || 10).map(formatJobResult);
    },
  });
}
