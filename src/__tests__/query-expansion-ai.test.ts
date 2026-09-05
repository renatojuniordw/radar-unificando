import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  expansionSchema,
  sanitizeVariants,
  generateAiExpansion,
} from '@/lib/core/ai/query-expansion';
import { QUERY_EXPANSION_PROMPT } from '@/lib/core/ai/prompts/query-expansion';

const llmCallMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/core/ai/shared/llm-call', () => ({ llmCall: llmCallMock }));

describe('expansionSchema', () => {
  it('should_accept_1_to_6_non_empty_variants', () => {
    expect(expansionSchema.safeParse({ variants: ['Data Analyst'] }).success).toBe(true);
    expect(expansionSchema.safeParse({ variants: ['a', 'b', 'c', 'd', 'e', 'f'] }).success).toBe(
      true,
    );
  });

  it('should_reject_empty_variant_list', () => {
    expect(expansionSchema.safeParse({ variants: [] }).success).toBe(false);
  });

  it('should_reject_more_than_6_variants', () => {
    const variants = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    expect(expansionSchema.safeParse({ variants }).success).toBe(false);
  });

  it('should_reject_empty_or_whitespace_only_variant', () => {
    expect(expansionSchema.safeParse({ variants: [''] }).success).toBe(false);
    expect(expansionSchema.safeParse({ variants: ['   '] }).success).toBe(false);
  });

  it('should_reject_variant_longer_than_60_chars', () => {
    expect(expansionSchema.safeParse({ variants: ['a'.repeat(61)] }).success).toBe(false);
    expect(expansionSchema.safeParse({ variants: ['a'.repeat(60)] }).success).toBe(true);
  });

  it('should_trim_variants_before_checking_length', () => {
    const padded = `${' '.repeat(3)}${'a'.repeat(60)}${' '.repeat(3)}`;
    expect(expansionSchema.safeParse({ variants: [padded] }).success).toBe(true);
  });
});

describe('sanitizeVariants', () => {
  it('should_keep_clean_variants', () => {
    expect(sanitizeVariants(['Data Analyst', 'Analista BI'], 'Analista de Dados')).toEqual([
      'Data Analyst',
      'Analista BI',
    ]);
  });

  it('should_drop_variants_with_junk_tokens_not_in_original', () => {
    expect(sanitizeVariants(['Data Analyst', 'Analista de Dados jobs'], 'Analista de Dados')).toEqual(
      ['Data Analyst'],
    );
  });

  it('should_drop_variants_containing_any_number', () => {
    expect(sanitizeVariants(['Analista 2026', 'Analista Senior 2x'], 'Analista')).toEqual([]);
  });

  it('should_keep_junk_token_when_original_contains_it', () => {
    expect(sanitizeVariants(['Analista de Dados vagas'], 'vagas analista')).toEqual([
      'Analista de Dados vagas',
    ]);
  });

  it('should_drop_junk_not_present_in_original_even_with_other_junk', () => {
    expect(sanitizeVariants(['Trabalho Analista'], 'vagas analista')).toEqual([]);
  });

  it('should_drop_whitespace_only_and_empty_variants', () => {
    expect(sanitizeVariants(['   ', '', 'Data Analyst'], 'Analista')).toEqual(['Data Analyst']);
  });

  it('should_be_case_insensitive_and_accent_aware', () => {
    // "VAGAS" vira "vagas" no tokenize e é lixo não presente no original.
    expect(sanitizeVariants(['VAGAS Analista'], 'Analista de Dados')).toEqual([]);
    // Mesmo token de lixo presente no original é tolerado.
    expect(sanitizeVariants(['Vagas Analista'], 'VAGAS Analista')).toEqual(['Vagas Analista']);
  });
});

describe('generateAiExpansion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_variants_from_llm_call', async () => {
    llmCallMock.mockResolvedValue({ variants: ['Data Analyst', 'Analista BI'] });

    await expect(generateAiExpansion('Analista de Dados')).resolves.toEqual([
      'Data Analyst',
      'Analista BI',
    ]);
  });

  it('should_call_llm_call_with_schema_prompt_and_query_in_tags', async () => {
    llmCallMock.mockResolvedValue({ variants: [] });

    await generateAiExpansion('Engenheiro de Software');

    expect(llmCallMock).toHaveBeenCalledWith(
      expansionSchema,
      QUERY_EXPANSION_PROMPT,
      '<query>\nEngenheiro de Software\n</query>',
      { maxOutputTokens: 300, eventName: 'query_expansion' },
    );
  });

  it('should_propagate_llm_errors', async () => {
    llmCallMock.mockRejectedValue(new Error('LLM fora do ar'));

    await expect(generateAiExpansion('Dev')).rejects.toThrow('LLM fora do ar');
  });
});