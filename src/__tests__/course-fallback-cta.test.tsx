// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/core/constants', () => ({
  IMPACT: {
    udemyFallbackUrl: 'https://trk.udemy.com/c/7591577/3193860/39854',
  },
}));

import { CourseFallbackCta } from '@/components/cursos/course-fallback-cta';

describe('CourseFallbackCta', () => {
  it('should_render_cta_heading', () => {
    render(<CourseFallbackCta />);
    expect(screen.getByText('Não encontrou o curso desejado?')).toBeTruthy();
  });

  it('should_render_cta_description', () => {
    render(<CourseFallbackCta />);
    expect(screen.getByText(/Procure através de nosso link/)).toBeTruthy();
  });

  it('should_render_udemy_link', () => {
    render(<CourseFallbackCta />);
    const link = screen.getByRole('link', { name: /PROCURAR NA UDEMY/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://trk.udemy.com/c/7591577/3193860/39854');
  });

  it('should_open_udemy_link_in_new_tab', () => {
    render(<CourseFallbackCta />);
    const link = screen.getByRole('link', { name: /PROCURAR NA UDEMY/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
