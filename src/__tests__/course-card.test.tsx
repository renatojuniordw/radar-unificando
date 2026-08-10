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

const aluraCourse: Course = {
  id: 'alura-python',
  provider: 'alura',
  title: 'Formação Python',
  description: 'Do básico ao avançado.',
  skillTags: ['python'],
  priceLabel: 'Assinatura a partir de R$ 99/mês',
  url: 'https://www.alura.com.br/formacao-python',
};

describe('CourseCard', () => {
  it('deve_renderizar_badge_udemy_titulo_preco_e_link_afiliado', () => {
    render(<CourseCard course={udemyCourse} />);

    expect(screen.getByText(/Udemy/i)).toBeTruthy();
    expect(screen.getByText(/Excel Avançado/i)).toBeTruthy();
    expect(screen.getByText(/R\$ 39,90/i)).toBeTruthy();

    const link = screen.getByRole('link', { name: /ver curso/i });
    expect(link.getAttribute('href')).toBe(udemyCourse.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('deve_renderizar_badge_alura_e_rating_quando_presente', () => {
    render(<CourseCard course={aluraCourse} />);

    expect(screen.getByText(/Alura/i)).toBeTruthy();
    expect(screen.getByText(/Formação Python/i)).toBeTruthy();
  });

  it('deve_omitir_descricao_na_variante_compacta', () => {
    render(<CourseCard course={udemyCourse} compact />);

    expect(screen.queryByText(/Fórmulas e dashboards/i)).toBeNull();
  });
});