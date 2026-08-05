// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('should_render_donation_link_to_doar_page', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /apoiar/i });
    expect(link.getAttribute('href')).toBe('/doar');
  });

  it('should_render_sobre_and_termos_links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /sobre/i }).getAttribute('href')).toBe('/sobre');
    expect(screen.getByRole('link', { name: /termos/i }).getAttribute('href')).toBe('/termos');
  });
});
