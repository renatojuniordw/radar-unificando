// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function Bomb(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('should_render_children_when_no_error', () => {
    render(
      <ErrorBoundary>
        <div>conteúdo ok</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteúdo ok')).toBeTruthy();
  });

  it('should_render_fallback_when_child_throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>algo quebrou</div>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('algo quebrou')).toBeTruthy();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('should_render_nothing_when_child_throws_without_fallback', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(container.innerHTML).toBe('');
    error.mockRestore();
  });
});