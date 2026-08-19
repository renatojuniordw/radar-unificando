// ---------------------------------------------------------------------------
// Expansão de queries de busca via LLM — gera variantes equivalentes (sinônimos
// PT/EN, nomes alternativos) para a busca por substring da Gupy. Segue o padrão
// do ats-analyzer: schema Zod + generate() + prompt com regras de segurança.
// Lança em erro — o fail-open fica no service (query-expansion/service.ts).
// ---------------------------------------------------------------------------

import { z } from 'zod';
import { removeAccents } from '@/lib/utils/string';
import { QUERY_EXPANSION_PROMPT } from './prompts/query-expansion';
import { llmCall } from './shared/llm-call';

export const expansionSchema = z.object({
  variants: z
    .array(z.string().trim().min(1, 'variante vazia').max(60, 'variante muito longa'))
    .min(1, 'lista vazia')
    .max(6, 'máximo de 6 variantes'),
});

export type ExpansionResult = z.infer<typeof expansionSchema>;

/** Palavras de lixo que a LLM costuma anexar a variantes (não são cargos). */
const JUNK_TOKENS = [
  'vagas', 'vaga', 'emprego', 'empregos', 'trabalho', 'trabalhos',
  'jobs', 'hiring', 'career', 'oportunidade', 'oportunidades', 'recrutamento',
];

function tokenize(text: string): string[] {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Descarta variantes com lixo (ex.: "Analista de Dados jobs", "Analista 2026").
 * Um token de lixo é tolerado apenas se a query original também o contém
 * (ex.: usuário digitou "vagas analista"). Números são sempre descartados.
 */
export function sanitizeVariants(variants: string[], original: string): string[] {
  const originalTokens = new Set(tokenize(original));
  return variants.filter((variant) => {
    if (!variant.trim()) return false;
    if (/\d/.test(variant)) return false;
    const junk = tokenize(variant).filter((token) => JUNK_TOKENS.includes(token));
    return junk.every((token) => originalTokens.has(token));
  });
}

/** Chama a LLM para gerar variantes da query. Lança em erro (o service trata). */
export async function generateAiExpansion(query: string): Promise<string[]> {
  const userPrompt = `<query>\n${query}\n</query>`;

  const raw = await llmCall(expansionSchema, QUERY_EXPANSION_PROMPT, userPrompt, {
    maxOutputTokens: 300,
    eventName: 'query_expansion',
  });
  return raw.variants;
}