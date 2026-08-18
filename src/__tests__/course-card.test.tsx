// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/cursos/course-card';
import type { Course } from '@/lib/core/courses/course-provider';

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
});