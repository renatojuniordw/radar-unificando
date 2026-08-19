// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CookieSettingsLink } from '@/components/ui/cookie-settings-link';

describe('CookieSettingsLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_render_cookies_button', () => {
    render(<CookieSettingsLink />);
    expect(screen.getByRole('button', { name: 'COOKIES' })).toBeTruthy();
  });

  it('should_clear_consent_and_show_aviso_exibido', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<CookieSettingsLink />);
    fireEvent.click(screen.getByRole('button', { name: 'COOKIES' }));
    expect(localStorage.getItem('cookie_consent')).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(screen.getByRole('button', { name: 'AVISO EXIBIDO ✓' })).toBeTruthy();
  });

  it('should_revert_label_after_2500ms', () => {
    render(<CookieSettingsLink />);
    fireEvent.click(screen.getByRole('button', { name: 'COOKIES' }));
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole('button', { name: 'COOKIES' })).toBeTruthy();
  });

  it('should_tolerate_local_storage_failure', () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<CookieSettingsLink />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'COOKIES' }))).not.toThrow();
    expect(screen.getByRole('button', { name: 'AVISO EXIBIDO ✓' })).toBeTruthy();
    removeItem.mockRestore();
  });

  it('should_change_color_on_hover', () => {
    render(<CookieSettingsLink />);
    const button = screen.getByRole('button') as HTMLButtonElement;
    fireEvent.mouseEnter(button);
    expect(button.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(button);
    expect(button.style.color).toBe('rgb(148, 163, 184)');
  });
});