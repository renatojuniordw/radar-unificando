import { describe, it, expect } from 'vitest';
import { COURSES } from '@/lib/core/courses/course-catalog';
import { buildAffiliateUrl, type Course } from '@/lib/core/courses/course-provider';

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
      // Slug real (letras/números/hífens), nunca slug vazio nem URL de busca.
      expect(course.url).toMatch(/^https:\/\/www\.udemy\.com\/course\/[a-z0-9-]+\/?$/);
    }
  });

  it('deve_ter_apenas_provider_udemy_ate_afiliacao_alura_ser_aprovada', () => {
    expect(COURSES.some((c) => c.provider === 'udemy')).toBe(true);
    expect(COURSES.every((c) => c.provider === 'udemy')).toBe(true);
  });

  it('deve_ter_pelo_menos_um_featured_para_fallback', () => {
    expect(COURSES.some((c) => c.featured)).toBe(true);
  });

  it('buildAffiliateUrl_nao_altera_url_de_provider_nao_udemy', () => {
    const alura: Course = {
      id: 'fixture-alura',
      provider: 'alura',
      title: 'Curso fixture',
      description: '',
      skillTags: ['fixture'],
      priceLabel: 'R$ 0',
      url: 'https://www.alura.com.br/fixture',
    };
    expect(buildAffiliateUrl(alura)).toBe(alura.url);
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