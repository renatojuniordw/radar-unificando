// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from '@/lib/utils/analytics';
import { trackCourseClick } from '@/lib/utils/course-analytics';

const PARAMS = {
  courseId: 'c1',
  skill: 'Python',
  platform: 'Udemy',
  origin: 'web' as const,
  url: 'https://trk.udemy.com/x',
};

describe('trackCourseClick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should_send_ga_event_and_beacon', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });

    trackCourseClick(PARAMS);

    expect(trackEvent).toHaveBeenCalledWith('course_click', {
      skill: 'Python',
      plataforma: 'Udemy',
      origem: 'web',
    });
    expect(sendBeacon).toHaveBeenCalledWith('/api/track/course-click', expect.any(Blob));
  });

  it('should_skip_beacon_when_send_beacon_unavailable', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true });
    trackCourseClick(PARAMS);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('should_not_throw_when_beacon_fails', () => {
    const sendBeacon = vi.fn(() => {
      throw new Error('quota');
    });
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    expect(() => trackCourseClick(PARAMS)).not.toThrow();
    expect(debug).toHaveBeenCalled();
    debug.mockRestore();
  });

  it('should_default_empty_skill_and_platform', () => {
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true });
    trackCourseClick({ courseId: 'c1', origin: 'chat', url: 'https://x.io' });
    expect(trackEvent).toHaveBeenCalledWith('course_click', {
      skill: '',
      plataforma: '',
      origem: 'chat',
    });
  });
});