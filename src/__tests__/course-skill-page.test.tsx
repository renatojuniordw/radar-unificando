import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock('@/components/cursos/course-card', () => ({
  CourseCard: () => <div>CARD</div>,
}));
vi.mock('@/components/cursos/course-grid', () => ({
  CourseGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/cursos/course-fallback-cta', () => ({
  CourseFallbackCta: () => <div>CTA</div>,
}));
vi.mock('@/components/seo/breadcrumb-schema', () => ({
  BreadcrumbSchema: () => null,
}));

import SkillPage, { generateMetadata, generateStaticParams } from '@/app/cursos/[skill]/page';
import { notFound } from 'next/navigation';

describe('SkillPage', () => {
  it('should_render_courses_for_valid_skill', async () => {
    const element = await SkillPage({ params: Promise.resolve({ skill: 'python' }) });
    expect(React.isValidElement(element)).toBe(true);
  });

  it('should_call_not_found_for_unknown_skill', async () => {
    await expect(
      SkillPage({ params: Promise.resolve({ skill: 'skill-inexistente-xyz' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('should_generate_metadata_for_valid_skill', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ skill: 'python' }) });
    expect(meta.title).toEqual({ absolute: 'Curso de python — Udemy | Radar Unificando' });
    expect(meta.alternates?.canonical).toContain('/cursos/python');
    expect(meta.openGraph?.url).toContain('/cursos/python');
  });

  it('should_generate_not_found_title_for_unknown_skill', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ skill: 'xyz-invalido' }) });
    expect(meta.title).toEqual({ absolute: 'Curso não encontrado | Radar Unificando' });
  });

  it('should_generate_static_params_for_all_skills', () => {
    const params = generateStaticParams();
    expect(params.length).toBeGreaterThan(10);
    expect(params).toContainEqual({ skill: 'python' });
  });
});