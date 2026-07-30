// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

describe('ErrorBoundary', () => {
  it('should_render_children_when_no_error', () => {
    render(<ErrorBoundary><div>Hello</div></ErrorBoundary>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('should_render_error_message_on_error', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    const { container } = render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('should_render_custom_fallback_when_provided', () => {
    const ThrowError = () => { throw new Error('Boom'); };
    render(<ErrorBoundary fallback={<div>Custom Fallback</div>}><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('Custom Fallback')).toBeTruthy();
  });

  it('should_render_tentar_novamente_button_on_error', () => {
    const ThrowError = () => { throw new Error('oops'); };
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('TENTAR NOVAMENTE')).toBeTruthy();
  });
});
