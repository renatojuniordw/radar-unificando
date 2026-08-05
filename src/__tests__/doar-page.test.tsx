// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DoarPage from '@/app/doar/page';

describe('DoarPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('should_render_heading_and_pix_section', () => {
    render(<DoarPage />);
    expect(screen.getByRole('heading', { name: /apoie/i })).toBeTruthy();
    expect(screen.getAllByText(/pix/i).length).toBeGreaterThan(0);
  });

  it('should_render_pix_key_and_copy_button', () => {
    render(<DoarPage />);
    expect(screen.getByText(/chave pix/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /copiar/i })).toBeTruthy();
  });

  it('should_copy_pix_key_when_clicked', async () => {
    render(<DoarPage />);
    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('000201') // brcode EMV
    );
  });

  it('should_render_costs_link', () => {
    render(<DoarPage />);
    expect(screen.getByRole('link', { name: /costs\.md/i }).getAttribute('href')).toContain('COSTS.md');
  });
});
