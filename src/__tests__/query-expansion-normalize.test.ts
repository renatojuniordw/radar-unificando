import { describe, it, expect } from 'vitest';
import { canonicalQuery, dedupeQueries } from '@/lib/core/pipeline/query-expansion/normalize';

describe('canonicalQuery', () => {
  it('canonicaliza_query_removendo_acentos_e_minusculas', () => {
    expect(canonicalQuery('Analista de Dados')).toBe('analista dados de');
    expect(canonicalQuery('ANALISTA DE DADOS')).toBe('analista dados de');
  });

  it('canonicaliza_ordenando_tokens_ignorando_ordem_das_palavras', () => {
    expect(canonicalQuery('Analista de Dados')).toBe(canonicalQuery('Dados Analista de'));
  });

  it('canonicaliza_tratando_ui_ux_e_ux_ui_como_equivalentes', () => {
    expect(canonicalQuery('UI/UX Designer')).toBe(canonicalQuery('UX/UI Designer'));
    expect(canonicalQuery('UI/UX Designer')).toBe('designer ui ux');
  });

  it('canonicaliza_ignorando_pontuacao', () => {
    expect(canonicalQuery('Customer Success')).toBe(canonicalQuery('Customer-Success'));
  });
});

describe('dedupeQueries', () => {
  it('deduplica_consultas_mantendo_primeira_ocorrencia', () => {
    expect(dedupeQueries(['UI/UX Designer', 'UX/UI Designer', 'Analista de Dados'])).toEqual([
      'UI/UX Designer',
      'Analista de Dados',
    ]);
  });

  it('deduplica_descarta_consultas_vazias_ou_sem_tokens', () => {
    expect(dedupeQueries(['', '   ', '!@#', 'Analista'])).toEqual(['Analista']);
  });

  it('deduplica_mantem_consultas_distintas', () => {
    expect(dedupeQueries(['Analista de Dados', 'Data Analyst', 'React'])).toEqual([
      'Analista de Dados',
      'Data Analyst',
      'React',
    ]);
  });
});