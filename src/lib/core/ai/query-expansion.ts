// ---------------------------------------------------------------------------
// Expansão de queries de busca via LLM — gera variantes equivalentes (sinônimos
// PT/EN, nomes alternativos) para a busca por substring da Gupy. Segue o padrão
// do ats-analyzer: schema Zod + generate() + prompt com regras de segurança.
// Lança em erro — o fail-open fica no service (query-expansion/service.ts).
// ---------------------------------------------------------------------------

import { z } from 'zod';
import { generate } from './llm-provider';
import { QUERY_EXPANSION_PROMPT } from './prompts/query-expansion';

export const expansionSchema = z.object({
  variants: z
    .array(z.string().trim().min(1, 'variante vazia').max(60, 'variante muito longa'))
    .min(1, 'lista vazia')
    .max(6, 'máximo de 6 variantes'),
});

export type ExpansionResult = z.infer<typeof expansionSchema>;

/** Chama a LLM para gerar variantes da query. Lança em erro (o service trata). */
export async function generateAiExpansion(query: string): Promise<string[]> {
  const prompt = `${QUERY_EXPANSION_PROMPT}

<query>
${query}
</query>`;

  const raw = await generate(expansionSchema, prompt, { maxOutputTokens: 300 });
  return raw.variants;
}