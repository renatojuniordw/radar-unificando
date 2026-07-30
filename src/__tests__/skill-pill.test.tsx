// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillPill } from '@/components/skill-pill';

describe('SkillPill', () => {
  it('should_render_label_text', () => {
    render(<SkillPill label="Python" />);
    expect(screen.getByText('Python')).toBeTruthy();
  });

  it('should_render_with_matched_variant', () => {
    const { container } = render(<SkillPill label="Python" matchType="matched" />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeTruthy();
  });

  it('should_render_with_missing_variant', () => {
    const { container } = render(<SkillPill label="AWS" matchType="missing" />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeTruthy();
  });

  it('should_render_with_neutral_variant_by_default', () => {
    const { container } = render(<SkillPill label="SQL" />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeTruthy();
  });

  it('should_render_delete_button_when_on_delete_provided', () => {
    render(<SkillPill label="Python" onDelete={() => {}} />);
    const deleteIcon = document.querySelector('.MuiChip-deleteIcon');
    expect(deleteIcon).toBeTruthy();
  });
});
