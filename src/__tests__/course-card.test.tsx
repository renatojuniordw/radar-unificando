// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from '@/components/cursos/course-card';
import { trackCourseClick } from '@/lib/utils/course-analytics';
import type { Course } from '@/lib/core/courses/course-provider';

vi.mock('@/lib/utils/course-analytics', () => ({
  trackCourseClick: vi.fn(),
}));

const udemyCourse: Course = {
  id: 'udemy-excel',
  provider: 'udemy',
  title: 'Excel Avançado',
  description: 'Fórmulas e dashboards.',
  skillTags: ['excel'],
  priceLabel: 'R$ 39,90',
  rating: '4.7',
  url: 'https://www.udemy.com/courses/search/?q=excel+avancado',
};

describe('CourseCard', () => {
  it('deve_renderizar_badge_udemy_titulo_preco_e_link_afiliado', () => {
    render(<CourseCard course={udemyCourse} />);

    expect(screen.getByText(/Udemy/i)).toBeTruthy();
    expect(screen.getByText(/Excel Avançado/i)).toBeTruthy();
    expect(screen.getByText(/R\$ 39,90/i)).toBeTruthy();
    expect(screen.getByText(/4\.7/)).toBeTruthy();

    const link = screen.getByRole('link', { name: /ver curso/i });
    expect(link.getAttribute('href')).toBe(udemyCourse.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('deve_omitir_descricao_na_variante_compacta', () => {
    render(<CourseCard course={udemyCourse} compact />);

    expect(screen.queryByText(/Fórmulas e dashboards/i)).toBeNull();
  });

  it('deve_emitir_track_course_click_com_origem_cursos_ao_clicar_no_link', () => {
    render(<CourseCard course={udemyCourse} />);

    fireEvent.click(screen.getByTestId('course-link'));

    expect(trackCourseClick).toHaveBeenCalledTimes(1);
    expect(trackCourseClick).toHaveBeenCalledWith({
      courseId: 'udemy-excel',
      skill: 'excel',
      platform: 'udemy',
      origin: 'cursos',
      url: udemyCourse.url,
    });
  });

  it('deve_emitir_track_course_click_com_origem_sidebar_na_variante_compacta', () => {
    render(<CourseCard course={udemyCourse} compact origin="sidebar" />);

    fireEvent.click(screen.getByTestId('course-link'));

    expect(trackCourseClick).toHaveBeenCalledWith(
      expect.objectContaining({
        skill: 'excel',
        platform: 'udemy',
        origin: 'sidebar',
      }),
    );
  });

  it('deve_omitir_rating_quando_o_curso_nao_tem_avaliacao', () => {
    const noRating: Course = { ...udemyCourse, rating: undefined };
    render(<CourseCard course={noRating} />);

    expect(screen.queryByText(/★/)).toBeNull();
    expect(screen.getByText(/VER CURSO/i)).toBeTruthy();
  });
});