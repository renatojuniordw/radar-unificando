// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import { ConsoleEasterEgg } from '@/components/ui/console-easter-egg';

describe('ConsoleEasterEgg', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).__RADAR_EASTER_EGG_LOGGED__;
  });

  it('should_log_radar_branding_to_console', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<ConsoleEasterEgg />);
    expect(log).toHaveBeenCalled();
    expect(log.mock.calls.some((c) => String(c[0]).includes('RADAR UNIFICANDO'))).toBe(true);
    log.mockRestore();
  });

  it('should_log_only_once_even_when_remounted', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { unmount } = render(<ConsoleEasterEgg />);
    unmount();
    render(<ConsoleEasterEgg />);
    expect(log.mock.calls.filter((c) => String(c[0]).includes('RADAR UNIFICANDO')).length).toBe(1);
    log.mockRestore();
  });
});