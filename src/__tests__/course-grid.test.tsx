// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CourseGrid } from '@/components/cursos/course-grid';

describe('CourseGrid', () => {
  it('should_render_children', () => {
    render(
      <CourseGrid>
        <div data-testid="course-1">Course 1</div>
        <div data-testid="course-2">Course 2</div>
      </CourseGrid>
    );
    expect(screen.getByTestId('course-1')).toBeTruthy();
    expect(screen.getByTestId('course-2')).toBeTruthy();
  });

  it('should_render_single_child', () => {
    render(
      <CourseGrid>
        <div>Single course</div>
      </CourseGrid>
    );
    expect(screen.getByText('Single course')).toBeTruthy();
  });

  it('should_render_multiple_children', () => {
    render(
      <CourseGrid>
        <span>React</span>
        <span>Node</span>
        <span>Python</span>
        <span>TypeScript</span>
        <span>Go</span>
      </CourseGrid>
    );
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('Node')).toBeTruthy();
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Go')).toBeTruthy();
  });
});
