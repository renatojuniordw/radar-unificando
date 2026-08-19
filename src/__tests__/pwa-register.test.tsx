// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { PwaRegister } from '@/components/ui/pwa-register';

describe('PwaRegister', () => {
  const register = vi.fn();

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    register.mockReset();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should_register_service_worker_on_load_in_production', () => {
    register.mockResolvedValue(undefined);
    render(<PwaRegister />);
    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('should_not_register_outside_production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<PwaRegister />);
    window.dispatchEvent(new Event('load'));
    expect(register).not.toHaveBeenCalled();
  });

  it('should_not_register_when_service_worker_unavailable', () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
    delete (navigator as any).serviceWorker;
    render(<PwaRegister />);
    window.dispatchEvent(new Event('load'));
    expect(register).not.toHaveBeenCalled();
  });

  it('should_tolerate_registration_failure', () => {
    register.mockRejectedValue(new Error('sw fail'));
    render(<PwaRegister />);
    expect(() => window.dispatchEvent(new Event('load'))).not.toThrow();
  });
});