// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from '@/components/chat/course-card';
import type { ParsedCourse } from '@/components/chat/job-card-parser';

const trackCourseClick = vi.fn();

vi.mock('@/lib/utils/course-analytics', () => ({
  trackCourseClick: (...args: any[]) => trackCourseClick(...args),
}));

describe('CourseCard', () => {
  const mockCourse: ParsedCourse = {
    title: 'Curso de React Avançado',
    provider: 'Udemy',
    skill: 'React',
    price: 'R$ 49,90',
    link: 'https://udemy.com/course/react-advanced',
  };

  beforeEach(() => {
    trackCourseClick.mockClear();
  });

  it('should render course title', () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText('Curso de React Avançado')).toBeTruthy();
  });

  it('should render provider name', () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText('UDEMY')).toBeTruthy();
  });

  it('should render skill and price', () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText(/Skill: React/)).toBeTruthy();
    expect(screen.getByText(/R\$ 49,90/)).toBeTruthy();
  });

  it('should render link button when link is provided', () => {
    render(<CourseCard course={mockCourse} />);

    const linkButton = screen.getByRole('link', { name: /ver curso/i });
    expect(linkButton).toBeTruthy();
    expect(linkButton.getAttribute('href')).toBe('https://udemy.com/course/react-advanced');
    expect(linkButton.getAttribute('target')).toBe('_blank');
  });

  it('should not render link button when link is not provided', () => {
    const courseWithoutLink: ParsedCourse = {
      title: 'Curso de Python',
      provider: 'Udemy',
    };

    render(<CourseCard course={courseWithoutLink} />);

    expect(screen.queryByRole('link', { name: /ver curso/i })).toBeNull();
  });

  it('should track course click when link is clicked', () => {
    render(<CourseCard course={mockCourse} />);

    const linkButton = screen.getByRole('link', { name: /ver curso/i });
    fireEvent.click(linkButton);

    expect(trackCourseClick).toHaveBeenCalledWith({
      courseId: 'https://udemy.com/course/react-advanced',
      skill: 'React',
      platform: 'Udemy',
      origin: 'chat',
      url: 'https://udemy.com/course/react-advanced',
    });
  });

  it('should handle course with missing optional fields', () => {
    const minimalCourse: ParsedCourse = {
      title: 'Curso Básico',
      link: 'https://example.com/course/123',
    };

    render(<CourseCard course={minimalCourse} />);

    expect(screen.getByText('Curso Básico')).toBeTruthy();
    expect(screen.getByRole('link', { name: /ver curso/i })).toBeTruthy();
    expect(screen.queryByText(/Skill:/)).toBeNull();
  });

  it('should render course without skill', () => {
    const courseWithoutSkill: ParsedCourse = {
      title: 'Curso de Java',
      provider: 'Alura',
      price: 'R$ 39,90',
      link: 'https://alura.com.br/course/java',
    };

    render(<CourseCard course={courseWithoutSkill} />);

    expect(screen.getByText('Curso de Java')).toBeTruthy();
    expect(screen.getByText('ALURA')).toBeTruthy();
    expect(screen.getByText(/R\$ 39,90/)).toBeTruthy();
    expect(screen.queryByText(/Skill:/)).toBeNull();
  });

  it('should render course without price', () => {
    const courseWithoutPrice: ParsedCourse = {
      title: 'Curso Gratuito',
      provider: 'FreeCodeCamp',
      skill: 'HTML',
      link: 'https://freecodecamp.org/course/html',
    };

    render(<CourseCard course={courseWithoutPrice} />);

    expect(screen.getByText('Curso Gratuito')).toBeTruthy();
    expect(screen.getByText('FREECODECAMP')).toBeTruthy();
    expect(screen.getByText(/Skill: HTML/)).toBeTruthy();
    expect(screen.queryByText(/R\$/)).toBeNull();
  });

  it('should render provider in uppercase', () => {
    const courseWithLowercaseProvider: ParsedCourse = {
      title: 'Curso de CSS',
      provider: 'udemy',
      link: 'https://udemy.com/course/css',
    };

    render(<CourseCard course={courseWithLowercaseProvider} />);

    expect(screen.getByText('UDEMY')).toBeTruthy();
  });
});
