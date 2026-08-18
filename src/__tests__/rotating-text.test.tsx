// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RotatingText } from '@/components/home/rotating-text';

describe('RotatingText', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_show_first_word_initial', () => {
    render(<RotatingText />);
    expect(screen.getByText('Dados')).toBeTruthy();
  });

  it('should_cycle_to_next_word_after_interval', () => {
    vi.useFakeTimers();
    render(<RotatingText />);
    act(() => {
      vi.advanceTimersByTime(2500);
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Marketing')).toBeTruthy();
  });

  it('should_cycle_back_to_first_word_after_full_rotation', () => {
    vi.useFakeTimers();
    render(<RotatingText />);
    act(() => {
      for (let i = 0; i < 8; i++) {
        vi.advanceTimersByTime(2500);
        vi.advanceTimersByTime(200);
      }
    });
    expect(screen.getByText('Dados')).toBeTruthy();
  });
});