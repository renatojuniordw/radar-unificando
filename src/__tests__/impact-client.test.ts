import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mapImpactItemToCourse,
  searchUdemyCourses,
  scoreImpactItem,
  isImpactMatch,
  tokenizeImpactText,
} from '@/lib/core/courses/impact-client';
import { IMPACT } from '@/lib/core/constants';

describe('mapImpactItemToCourse', () => {
  it('deve_mapear_item_do_impact_para_course', () => {
    const course = mapImpactItemToCourse(
      {
        ItemSID: '1234',
        Name: 'Python do Zero ao Avançado',
        Description: 'Curso completo de Python.',
        Price: 29.9,
        Rating: 4.7,
        RatingCount: 1200,
        Url: 'https://www.udemy.com/course/python-do-zero',
      },
      'python',
    );

    expect(course).not.toBeNull();
    expect(course!.id).toBe('impact-udemy-1234');
    expect(course!.provider).toBe('udemy');
    expect(course!.title).toBe('Python do Zero ao Avançado');
    expect(course!.priceLabel).toBe('R$ 29,90');
    expect(course!.rating).toBe('4.7 (1200)');
    expect(course!.url).toBe('https://www.udemy.com/course/python-do-zero');
    expect(course!.skillTags).toEqual(['python']);
  });

  it('deve_retornar_null_para_item_sem_url_ou_titulo', () => {
    expect(mapImpactItemToCourse({ ItemSID: '1' }, 'python')).toBeNull();
    expect(mapImpactItemToCourse({ Url: 'https://x' }, 'python')).toBeNull();
  });
});

describe('scoreImpactItem', () => {
  it('deve_pontuar_match_no_titulo', () => {
    const score = scoreImpactItem({ Name: 'Curso de Python Completo' }, ['python']);
    expect(score.titleMatches).toBe(1);
    expect(score.total).toBeGreaterThanOrEqual(3);
    expect(isImpactMatch(score)).toBe(true);
  });

  it('um_match_so_na_descricao_nao_e_relevante', () => {
    const score = scoreImpactItem(
      { Name: 'Programação Web', Description: 'Aprenda Python' },
      ['python'],
    );
    expect(score.titleMatches).toBe(0);
    expect(score.otherMatches).toBe(1);
    expect(isImpactMatch(score)).toBe(false);
  });

  it('dois_matches_na_descricao_sao_relevantes', () => {
    const score = scoreImpactItem(
      { Name: 'Programação Web', Description: 'Python para análise de dados' },
      ['python', 'dados'],
    );
    expect(score.otherMatches).toBe(2);
    expect(isImpactMatch(score)).toBe(true);
  });

  it('deve_normalizar_acentos_na_query_e_no_titulo', () => {
    expect(tokenizeImpactText('tráfego')).toEqual(['trafego']);
    const score = scoreImpactItem({ Name: 'Tráfego Pago para Iniciantes' }, ['trafego']);
    expect(score.titleMatches).toBe(1);
  });

  it('deve_aplicar_boost_pt_por_palavra_e_por_acento', () => {
    expect(scoreImpactItem({ Name: 'Curso de Excel Completo' }, ['excel']).ptBoost).toBe(2);
    expect(scoreImpactItem({ Name: 'Excel Avançado' }, ['excel']).ptBoost).toBe(2);
    expect(scoreImpactItem({ Name: 'Data Science Masterclass' }, ['data']).ptBoost).toBe(0);
  });

  it('deve_descartar_titulo_em_script_nao_latino', () => {
    const score = scoreImpactItem({ Name: 'دورة بايثون كاملة' }, ['python']);
    expect(score.nonLatinPenalty).toBeLessThan(0);
    expect(isImpactMatch(score)).toBe(false);
  });

  it('isImpactMatch_deve_respeitar_boundaries', () => {
    expect(isImpactMatch({ titleMatches: 1, otherMatches: 0, ptBoost: 0, nonLatinPenalty: 0, total: 3 })).toBe(true);
    expect(isImpactMatch({ titleMatches: 0, otherMatches: 2, ptBoost: 0, nonLatinPenalty: 0, total: 2 })).toBe(true);
    expect(isImpactMatch({ titleMatches: 0, otherMatches: 1, ptBoost: 0, nonLatinPenalty: 0, total: 1 })).toBe(false);
    expect(isImpactMatch({ titleMatches: 1, otherMatches: 0, ptBoost: 0, nonLatinPenalty: -100, total: -97 })).toBe(false);
  });
});

describe('searchUdemyCourses (fail-open)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('deve_retornar_vazio_sem_chaves_configuradas', async () => {
    vi.stubEnv('IMPACT_ACCOUNT_SID', '');
    vi.stubEnv('IMPACT_AUTH_TOKEN', '');
    await expect(searchUdemyCourses('python', 5)).resolves.toEqual([]);
  });

  it('deve_retornar_vazio_para_query_sem_tokens', async () => {
    vi.stubEnv('IMPACT_ACCOUNT_SID', 'sid');
    vi.stubEnv('IMPACT_AUTH_TOKEN', 'token');
    vi.stubEnv('IMPACT_UDEMY_CATALOG_ID', IMPACT.udemyCatalogId);
    await expect(searchUdemyCourses('!!!', 5)).resolves.toEqual([]);
  });

  it('deve_paginar_filtrar_e_ordenar_por_score', async () => {
    vi.stubEnv('IMPACT_ACCOUNT_SID', 'sid');
    vi.stubEnv('IMPACT_AUTH_TOKEN', 'token');
    vi.stubEnv('IMPACT_UDEMY_CATALOG_ID', IMPACT.udemyCatalogId);

    const page1 = {
      Items: [
        { Id: '1', Name: 'Curso de Python Completo', Description: 'Python do zero', Url: 'https://www.udemy.com/course/python-1', Rating: 4.9, RatingCount: 100 },
        { Id: '2', Name: 'Emotional Intelligence', Description: 'Soft skills', Url: 'https://www.udemy.com/course/ei', Rating: 4.8, RatingCount: 500 },
      ],
      '@nextpageuri': '/Mediapartners/sid/Catalogs/26324/Items?PageSize=100&AfterId=abc',
    };
    const page2 = {
      Items: [
        { Id: '3', Name: 'Python para Dados', Description: 'Análise com Python', Url: 'https://www.udemy.com/course/python-3', Rating: 4.7, RatingCount: 300 },
      ],
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 });
    vi.stubGlobal('fetch', fetchMock);

    const courses = await searchUdemyCourses('python', 2);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(courses).toHaveLength(2);
    // Python no título pontua mais que "Python para Dados" (título também tem python).
    expect(courses[0].title).toBe('Curso de Python Completo');
    expect(courses.every((c) => c.title !== 'Emotional Intelligence')).toBe(true);
  });

  it('deve_parar_cedo_quando_ja_tem_candidatos_suficientes', async () => {
    vi.stubEnv('IMPACT_ACCOUNT_SID', 'sid');
    vi.stubEnv('IMPACT_AUTH_TOKEN', 'token');
    vi.stubEnv('IMPACT_UDEMY_CATALOG_ID', IMPACT.udemyCatalogId);

    const page1 = {
      Items: [
        { Id: '1', Name: 'Python 1', Url: 'https://www.udemy.com/course/p1' },
        { Id: '2', Name: 'Python 2', Url: 'https://www.udemy.com/course/p2' },
        { Id: '3', Name: 'Python 3', Url: 'https://www.udemy.com/course/p3' },
        { Id: '4', Name: 'Python 4', Url: 'https://www.udemy.com/course/p4' },
      ],
      '@nextpageuri': '/Mediapartners/sid/Catalogs/26324/Items?PageSize=100&AfterId=abc',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => page1 });
    vi.stubGlobal('fetch', fetchMock);

    // limit=2 → early-stop em 4 matches (limit*2) → só 1 página.
    const courses = await searchUdemyCourses('python', 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(courses).toHaveLength(2);
  });
});
