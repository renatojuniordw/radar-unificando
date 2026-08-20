// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    accent: '#ccff00',
    muted: '#64748b',
    fontMono: 'ui-monospace, monospace',
  },
}));

import { LoadingOverlay } from '@/components/home/loading-overlay';

describe('LoadingOverlay', () => {
  it('should_render_with_status_role', () => {
    render(<LoadingOverlay />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('should_have_aria_live_polite', () => {
    render(<LoadingOverlay />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('should_have_aria_busy_true', () => {
    render(<LoadingOverlay />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
  });

  it('should_show_loading_text', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Buscando vagas...')).toBeTruthy();
  });

  it('should_show_source_text', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Gupy · InHire')).toBeTruthy();
  });
});
