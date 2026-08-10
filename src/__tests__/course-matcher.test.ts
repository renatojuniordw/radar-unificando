import { describe, it, expect } from 'vitest';
import { recommendCourses, TECH_AREAS } from '@/lib/core/courses/course-matcher';
import { COURSES } from '@/lib/core/courses/course-catalog';

describe('recommendCourses', () => {
  it('deve_retornar_cursos_featured_quando_sem_termos', () => {
    const result = recommendCourses([], null, 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result.every((c) => c.featured)).toBe(true);
  });

  it('deve_priorizar_alura_quando_area_e_tech_e_skill_tech', () => {
    const result = recommendCourses(['Kubernetes'], 'Desenvolvimento', 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].provider).toBe('alura');
    expect(result[0].skillTags.some((t) => t.includes('kubernetes'))).toBe(true);
  });

  it('deve_priorizar_udemy_para_skill_de_area_geral', () => {
    const result = recommendCourses(['Excel'], 'Administrativo', 4);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].provider).toBe('udemy');
    expect(result[0].skillTags.some((t) => t.includes('excel'))).toBe(true);
  });

  it('deve_respeitar_cap_de_4_cursos_e_max_2_por_provider', () => {
    const result = recommendCourses(['Python', 'React', 'Excel', 'Power BI', 'RH', 'Vendas'], 'Tecnologia', 4);
    expect(result.length).toBeLessThanOrEqual(4);
    const alura = result.filter((c) => c.provider === 'alura').length;
    const udemy = result.filter((c) => c.provider === 'udemy').length;
    expect(alura).toBeLessThanOrEqual(2);
    expect(udemy).toBeLessThanOrEqual(2);
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

  it('deve_considerar_area_tech_na_lista_TECH_AREAS', () => {
    expect(TECH_AREAS).toContain('devops');
    expect(TECH_AREAS).toContain('dados');
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