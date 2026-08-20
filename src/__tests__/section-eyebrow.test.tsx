// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    accent: '#ccff00',
    fontMono: 'ui-monospace, monospace',
  },
}));

import { SectionEyebrow } from '@/components/ui/section-eyebrow';

describe('SectionEyebrow', () => {
  it('should_render_children_text', () => {
    render(<SectionEyebrow>SKILLS MAIS PROCURADAS</SectionEyebrow>);
    expect(screen.getByText('SKILLS MAIS PROCURADAS')).toBeTruthy();
  });

  it('should_render_different_text', () => {
    render(<SectionEyebrow>NOVA SEÇÃO</SectionEyebrow>);
    expect(screen.getByText('NOVA SEÇÃO')).toBeTruthy();
  });

  it('should_render_with_custom_color', () => {
    render(<SectionEyebrow color="#ff0000">TEST</SectionEyebrow>);
    const el = screen.getByText('TEST');
    expect(el).toBeTruthy();
  });

  it('should_render_with_custom_margin_bottom', () => {
    render(<SectionEyebrow mb={5}>TEST</SectionEyebrow>);
    const el = screen.getByText('TEST');
    expect(el).toBeTruthy();
  });
});
