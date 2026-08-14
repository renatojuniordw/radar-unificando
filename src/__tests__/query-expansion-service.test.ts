import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  getMapExpansion: mockGetMap,
  getExpansion: mockGetCache,
  setExpansion: mockSetCache,
  generateAiExpansion: mockGenerateAi,
} = vi.hoisted(() => ({
  getMapExpansion: vi.fn(),
  getExpansion: vi.fn(),
  setExpansion: vi.fn(),
  generateAiExpansion: vi.fn(),
}));

vi.mock('@/lib/core/pipeline/query-expansion/map', () => ({ getMapExpansion: mockGetMap }));
vi.mock('@/lib/core/pipeline/query-expansion/cache', () => ({
  getExpansion: mockGetCache,
  setExpansion: mockSetCache,
}));
vi.mock('@/lib/core/ai/query-expansion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/core/ai/query-expansion')>();
  return { ...actual, generateAiExpansion: mockGenerateAi };
});

import { expandQueries, MAX_EXPANDED_QUERIES } from '@/lib/core/pipeline/query-expansion/service';

describe('expandQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMap.mockReturnValue(null);
    mockGetCache.mockResolvedValue(null);
    mockGenerateAi.mockResolvedValue(['Data Analyst', 'Analista BI']);
  });

  it('usa_mapa_sem_chamar_cache_nem_llm', async () => {
    mockGetMap.mockReturnValue(['Data Analyst']);

    const result = await expandQueries(['Analista de Dados']);

    expect(result).toEqual(['Analista de Dados', 'Data Analyst']);
    expect(mockGetCache).not.toHaveBeenCalled();
    expect(mockGenerateAi).not.toHaveBeenCalled();
  });

  it('usa_cache_antes_de_chamar_llm', async () => {
    mockGetCache.mockResolvedValue(['Data Analyst']);

    const result = await expandQueries(['Analista de Dados']);

    expect(result).toEqual(['Analista de Dados', 'Data Analyst']);
    expect(mockGenerateAi).not.toHaveBeenCalled();
  });

  it('chama_llm_e_salva_no_cache_no_cache_miss', async () => {
    const result = await expandQueries(['Analista de Dados']);

    expect(result).toEqual(['Analista de Dados', 'Data Analyst', 'Analista BI']);
    expect(mockGenerateAi).toHaveBeenCalledWith('Analista de Dados');
    expect(mockSetCache).toHaveBeenCalledWith('analista dados de', ['Data Analyst', 'Analista BI']);
  });

  it('inclui_consulta_original_sempre_na_expansao', async () => {
    mockGenerateAi.mockResolvedValue(['Data Analyst']);

    const result = await expandQueries(['Analista de Dados']);

    expect(result[0]).toBe('Analista de Dados');
  });

  it('retorna_apenas_consultas_originais_quando_llm_falha', async () => {
    mockGenerateAi.mockRejectedValue(new Error('LLM fora do ar'));

    const result = await expandQueries(['Analista de Dados']);

    expect(result).toEqual(['Analista de Dados']);
    expect(mockSetCache).not.toHaveBeenCalled();
  });

  it('descarta_variantes_com_lixo_antes_de_cachear', async () => {
    mockGenerateAi.mockResolvedValue([
      'Data Analyst',
      'Analista de Dados jobs',
      'Analista 2026',
      'Vagas Analista de Dados',
    ]);

    const result = await expandQueries(['Analista de Dados']);

    expect(result).toEqual(['Analista de Dados', 'Data Analyst']);
    expect(mockSetCache).toHaveBeenCalledWith('analista dados de', ['Data Analyst']);
  });

  it('deduplica_consultas_expandidas_por_forma_canonica', async () => {
    mockGetMap.mockReturnValue(['UX/UI Designer']);

    const result = await expandQueries(['UI/UX Designer']);

    expect(result).toEqual(['UI/UX Designer']);
  });

  it('limita_total_de_consultas_expandidas_a_30', async () => {
    mockGetMap.mockImplementation((query) =>
      Array.from({ length: 6 }, (_, i) => `${query} Variante ${i}`),
    );
    const queries = Array.from({ length: 20 }, (_, i) => `Cargo ${i}`);

    const result = await expandQueries(queries);

    expect(result.length).toBe(MAX_EXPANDED_QUERIES);
    expect(result.slice(0, 20)).toEqual(queries); // originais sobrevivem ao corte
  });

  it('nao_dispara_llm_duplicado_para_mesma_consulta_concorrente', async () => {
    mockGenerateAi.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(['UX Designer']), 10)),
    );

    const [a, b] = await Promise.all([
      expandQueries(['Product Designer']),
      expandQueries(['Product Designer']),
    ]);

    expect(mockGenerateAi).toHaveBeenCalledTimes(1);
    expect(a).toEqual(['Product Designer', 'UX Designer']);
    expect(b).toEqual(['Product Designer', 'UX Designer']);
  });

  it('descarta_consultas_vazias_da_entrada', async () => {
    await expandQueries(['', '   ', 'Analista de Dados']);

    expect(mockGenerateAi).toHaveBeenCalledTimes(1);
    expect(mockGenerateAi).toHaveBeenCalledWith('Analista de Dados');
  });

  it('retorna_originais_deduplicados_se_tudo_falhar', async () => {
    mockGetCache.mockRejectedValue(new Error('redis down'));
    mockGenerateAi.mockRejectedValue(new Error('LLM fora do ar'));

    const result = await expandQueries(['UI/UX Designer', 'UX/UI Designer', 'Analista de Dados']);

    expect(result).toEqual(['UI/UX Designer', 'Analista de Dados']);
  });
});