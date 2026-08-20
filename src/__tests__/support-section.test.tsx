// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

import { SupportSection } from '@/components/shared/support-section';

describe('SupportSection', () => {
  it('should_render_support_heading', () => {
    render(<SupportSection />);
    expect(screen.getByText(/APOIE O PROJETO/)).toBeTruthy();
  });

  it('should_render_support_description', () => {
    render(<SupportSection />);
    expect(screen.getByText(/Sabia que o Radar é mantido por um único desenvolvedor/)).toBeTruthy();
  });

  it('should_render_donate_link', () => {
    render(<SupportSection />);
    const link = screen.getByRole('link', { name: /QUERO DOAR/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/doar');
  });

  it('should_render_heart_icon', () => {
    render(<SupportSection />);
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
