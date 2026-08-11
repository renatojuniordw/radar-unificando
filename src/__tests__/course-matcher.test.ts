import { describe, it, expect } from 'vitest';
import { recommendCourses } from '@/lib/core/courses/course-matcher';
import { COURSES } from '@/lib/core/courses/course-catalog';

describe('recommendCourses', () => {
  it('deve_retornar_cursos_featured_quando_sem_termos', () => {
    const result = recommendCourses([], null, 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result.every((c) => c.featured)).toBe(true);
  });

  it('deve_retornar_curso_udemy_com_melhor_match_primeiro', () => {
    const result = recommendCourses(['Kubernetes'], 'Desenvolvimento', 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].provider).toBe('udemy');
    expect(result[0].skillTags.some((t) => t.includes('kubernetes'))).toBe(true);
  });

  it('deve_retornar_curso_udemy_para_skill_de_area_geral', () => {
    const result = recommendCourses(['Excel'], 'Administrativo', 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].provider).toBe('udemy');
    expect(result[0].skillTags.some((t) => t.includes('excel'))).toBe(true);
  });

  it('deve_respeitar_cap_de_limit_cursos', () => {
    const result = recommendCourses(['Python', 'React', 'Excel', 'Power BI', 'RH', 'Vendas'], 'Tecnologia', 4);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result.every((c) => c.provider === 'udemy')).toBe(true);
  });

  it('deve_retornar_ate_o_limite_pedido_mesmo_com_muitos_matches', () => {
    // Regressão: antes da remoção da Alura, o cap por provider (2) limitava
    // o resultado a 2 cursos mesmo havendo 5+ matches e limit=4, já que
    // todos os cursos agora são 'udemy'.
    const result = recommendCourses(['administrativo', 'gestao', 'rh', 'financeiro'], null, 4);
    expect(result.length).toBe(4);
  });

  it('deve_fazer_fallback_para_featured_quando_nenhuma_skill_matcheia', () => {
    const result = recommendCourses(['zzz-skill-inexistente'], null, 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.featured)).toBe(true);
  });

  it('deve_retornar_cursos_do_catalogo', () => {
    const result = recommendCourses(['Python'], 'Dev', 4);
    for (const course of result) {
      expect(COURSES.some((c) => c.id === course.id)).toBe(true);
    }
  });

  it('deve_matchear_sinonimos_de_skills', () => {
    const k8s = recommendCourses(['k8s'], 'DevOps', 4);
    expect(k8s.length).toBeGreaterThan(0);
    expect(k8s[0].skillTags.some((t) => t.includes('kubernetes'))).toBe(true);

    const english = recommendCourses(['english'], null, 4);
    expect(english.length).toBeGreaterThan(0);
    expect(english[0].skillTags.some((t) => t.includes('ingles'))).toBe(true);
  });
});