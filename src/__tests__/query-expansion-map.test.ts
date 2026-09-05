import { describe, it, expect } from 'vitest';
import {
  QUERY_EXPANSION_MAP,
  getMapExpansion,
} from '@/lib/core/pipeline/query-expansion/map';
import { canonicalQuery } from '@/lib/core/pipeline/query-expansion/normalize';

describe('QUERY_EXPANSION_MAP', () => {
  it('should_contain_entries_keyed_by_canonical_form', () => {
    expect(Object.keys(QUERY_EXPANSION_MAP).length).toBeGreaterThan(0);
    for (const key of Object.keys(QUERY_EXPANSION_MAP)) {
      expect(key).toBe(canonicalQuery(key));
    }
  });

  it('should_map_every_entry_to_non_empty_variant_lists', () => {
    for (const [key, variants] of Object.entries(QUERY_EXPANSION_MAP)) {
      expect(variants.length, `entry ${key}`).toBeGreaterThan(0);
      for (const variant of variants) {
        expect(variant.trim(), `variant of ${key}`).not.toBe('');
      }
    }
  });

  it('should_include_curated_roles_without_physical_design_markers', () => {
    for (const [key, variants] of Object.entries(QUERY_EXPANSION_MAP)) {
      expect(key).not.toMatch(/moda|estamparia/i);
      for (const variant of variants) {
        expect(variant).not.toMatch(/moda|estamparia/i);
      }
    }
  });
});

describe('getMapExpansion', () => {
  it('should_return_known_variants_for_curated_role', () => {
    expect(getMapExpansion('Analista de Dados')).toEqual([
      'Analista de Dados',
      'Data Analyst',
      'Analista de Business Intelligence',
      'Analista BI',
    ]);
  });

  it('should_normalize_query_before_looking_up', () => {
    expect(getMapExpansion('ANALISTA  DE DADOS')).toBe(getMapExpansion('Analista de Dados'));
    expect(getMapExpansion('Dados, Analista de')).toBe(getMapExpansion('Analista de Dados'));
  });

  it('should_treat_token_reorderings_as_equivalent', () => {
    const direct = getMapExpansion('Analista de Dados');
    const reordered = getMapExpansion('Dados Analista de');
    expect(direct).not.toBeNull();
    expect(direct).toEqual(reordered);
  });

  it('should_not_match_roles_absent_from_map', () => {
    // "UX/UI Designer" não é chave do mapa; existe apenas como variante de
    // "Product Designer", então a consulta direta não deve expandir.
    expect(getMapExpansion('UX/UI Designer')).toBeNull();
  });

  it('should_expose_related_variants_inside_product_designer_entry', () => {
    expect(QUERY_EXPANSION_MAP[canonicalQuery('Product Designer')]).toEqual(
      expect.arrayContaining(['UX Designer', 'UI Designer', 'UX/UI Designer']),
    );
  });

  it('should_lookup_every_map_entry_through_canonical_form', () => {
    for (const [key, variants] of Object.entries(QUERY_EXPANSION_MAP)) {
      expect(getMapExpansion(canonicalQuery(key))).toEqual(variants);
    }
  });

  it('should_return_null_for_unknown_role', () => {
    expect(getMapExpansion('Médico Veterinário')).toBeNull();
  });

  it('should_return_null_for_empty_or_symbol_only_queries', () => {
    expect(getMapExpansion('')).toBeNull();
    expect(getMapExpansion('   ')).toBeNull();
    expect(getMapExpansion('!@#')).toBeNull();
  });
});