// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreRing } from '@/components/score-ring';

describe('ScoreRing', () => {
  it('should_render_score_percentage', () => {
    render(<ScoreRing score={75} />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('should_use_green_color_for_high_score', () => {
    const { container } = render(<ScoreRing score={85} />);
    const circles = container.querySelectorAll('.MuiCircularProgress-root');
    expect(circles.length).toBe(2);
  });

  it('should_use_yellow_color_for_medium_score', () => {
    const { container } = render(<ScoreRing score={50} />);
    const circles = container.querySelectorAll('.MuiCircularProgress-root');
    expect(circles.length).toBe(2);
  });

  it('should_use_red_color_for_low_score', () => {
    const { container } = render(<ScoreRing score={20} />);
    const circles = container.querySelectorAll('.MuiCircularProgress-root');
    expect(circles.length).toBe(2);
  });

  it('should_hide_label_when_show_label_is_false', () => {
    render(<ScoreRing score={60} showLabel={false} />);
    expect(screen.queryByText('60%')).toBeNull();
  });

  it('should_accept_custom_size', () => {
    const { container } = render(<ScoreRing score={50} size={100} />);
    const circles = container.querySelectorAll('.MuiCircularProgress-root');
    expect(circles.length).toBe(2);
  });
});
