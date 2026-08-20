// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AutoRefresh } from '@/components/admin/auto-refresh';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe('AutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without errors', () => {
    render(<AutoRefresh />);
  });

  it('should call router.refresh at specified interval', () => {
    render(<AutoRefresh intervalMs={30000} />);

    // Initially no calls
    expect(mockRefresh).not.toHaveBeenCalled();

    // After 30 seconds, refresh should be called
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    // After another 30 seconds, refresh should be called again
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it('should use default interval of 60000ms when not specified', () => {
    render(<AutoRefresh />);

    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should clear interval on unmount', () => {
    const { unmount } = render(<AutoRefresh intervalMs={1000} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    unmount();

    // After unmount, no more calls should happen
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
