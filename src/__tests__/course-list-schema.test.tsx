// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  CourseListSchema,
  type CourseListItem,
} from '@/components/seo/course-list-schema';
import { coursesForSlug } from '@/lib/core/courses/course-skills';

const SAMPLE_COURSES: CourseListItem[] = [
  {
    title: 'Excel Avançado: do Básico ao Profissional',
    description: 'Fórmulas, tabelas dinâmicas, dashboards e automação.',
    url: 'https://www.udemy.com/course/curso-excel-completo/',
    providerName: 'Udemy',
    providerUrl: 'https://www.udemy.com',
  },
  {
    title: 'Power BI Completo',
    description: 'Dashboard profissional com Power BI.',
    url: 'https://www.udemy.com/course/power-bi-completo-do-basico-ao-avancado/',
    providerName: 'Udemy',
    providerUrl: 'https://www.udemy.com',
  },
];

describe('CourseListSchema', () => {
  it('should render nothing when courses is undefined', () => {
    const { container } = render(
      <CourseListSchema courses={undefined as unknown as CourseListItem[]} />
    );
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('should render nothing when courses is an empty array', () => {
    const { container } = render(<CourseListSchema courses={[]} />);
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('should render a script tag with type application/ld+json when courses exist', () => {
    const { container } = render(<CourseListSchema courses={SAMPLE_COURSES} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should have @type ItemList and correct @context', () => {
    const { container } = render(<CourseListSchema courses={SAMPLE_COURSES} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@type']).toBe('ItemList');
    expect(content['@context']).toBe('https://schema.org');
  });

  it('should render one ListItem per course with sequential positions starting at 1', () => {
    const { container } = render(<CourseListSchema courses={SAMPLE_COURSES} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.itemListElement).toHaveLength(2);
    content.itemListElement.forEach((entry: { position: number }, index: number) => {
      expect(entry.position).toBe(index + 1);
    });
  });

  it('each ListItem should embed a Course item with name, description and url from the course', () => {
    const { container } = render(<CourseListSchema courses={SAMPLE_COURSES} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.itemListElement.forEach((entry: { item: any }, index: number) => {
      expect(entry.item['@type']).toBe('Course');
      expect(entry.item.name).toBe(SAMPLE_COURSES[index].title);
      expect(entry.item.description).toBe(SAMPLE_COURSES[index].description);
      expect(entry.item.url).toBe(SAMPLE_COURSES[index].url);
    });
  });

  it('each Course item should have a provider Organization with name and sameAs', () => {
    const { container } = render(<CourseListSchema courses={SAMPLE_COURSES} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    content.itemListElement.forEach((entry: { item: any }, index: number) => {
      expect(entry.item.provider['@type']).toBe('Organization');
      expect(entry.item.provider.name).toBe(SAMPLE_COURSES[index].providerName);
      expect(entry.item.provider.sameAs).toBe(SAMPLE_COURSES[index].providerUrl);
    });
  });

  it('should mirror the real course catalog for a skill slug', () => {
    // Mesmo mapeamento usado em src/app/cursos/[skill]/page.tsx
    const courses = coursesForSlug('excel');
    expect(courses.length).toBeGreaterThan(0);

    const mapped: CourseListItem[] = courses.map((course) => ({
      title: course.title,
      description: course.description,
      url: course.url,
      providerName: 'Udemy',
      providerUrl: 'https://www.udemy.com',
    }));

    const { container } = render(<CourseListSchema courses={mapped} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');

    expect(content.itemListElement).toHaveLength(courses.length);
    content.itemListElement.forEach((entry: { item: any }, index: number) => {
      expect(entry.item.name).toBe(courses[index].title);
      expect(entry.item.description).toBe(courses[index].description);
      expect(entry.item.url).toBe(courses[index].url);
      expect(entry.item.provider.name).toBe('Udemy');
      expect(entry.item.provider.sameAs).toBe('https://www.udemy.com');
    });
  });
});