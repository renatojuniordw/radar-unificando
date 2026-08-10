import { describe, it, expect } from 'vitest';
import { COURSES } from '@/lib/core/courses/course-catalog';
import { buildAffiliateUrl } from '@/lib/core/courses/course-provider';

describe('course-catalog', () => {
  it('deve_ter_ids_unicos', () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('deve_ter_skillTags_nao_vazios_e_urls_validas', () => {
    for (const course of COURSES) {
      expect(course.skillTags.length).toBeGreaterThan(0);
      expect(course.title).toBeTruthy();
      expect(course.priceLabel).toBeTruthy();
      expect(course.url.startsWith('https://')).toBe(true);
    }
  });

  it('deve_apontar_cursos_udemy_para_pagina_de_curso_nao_de_busca', () => {
    const udemy = COURSES.filter((c) => c.provider === 'udemy');
    expect(udemy.length).toBeGreaterThan(0);
    for (const course of udemy) {
      expect(course.url).toMatch(/^https:\/\/www\.udemy\.com\/course\//);
    }
  });

  it('deve_ter_ambos_providers_representados', () => {
    expect(COURSES.some((c) => c.provider === 'alura')).toBe(true);
    expect(COURSES.some((c) => c.provider === 'udemy')).toBe(true);
  });

  it('deve_ter_pelo_menos_um_featured_para_fallback', () => {
    expect(COURSES.some((c) => c.featured)).toBe(true);
  });

  it('buildAffiliateUrl_nao_altera_url_da_alura', () => {
    const alura = COURSES.find((c) => c.provider === 'alura');
    expect(alura).toBeDefined();
    expect(buildAffiliateUrl(alura!)).toBe(alura!.url);
  });

  it('buildAffiliateUrl_adiciona_ref_da_udemy_quando_env_definido', () => {
    const udemy = COURSES.find((c) => c.provider === 'udemy');
    expect(udemy).toBeDefined();
    const original = process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_REF;
    process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_REF = 'teste-afiliado';
    try {
      const url = buildAffiliateUrl(udemy!);
      expect(url).toContain('ref=teste-afiliado');
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_REF;
      else process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_REF = original;
    }
  });
});