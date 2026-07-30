import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnv } from '@/lib/infrastructure/security/env';

describe('EnvValidator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should_log_error_when_required_env_vars_are_missing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    validateEnv();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('DATABASE_URL');
    expect(consoleSpy.mock.calls[0][0]).toContain('AUTH_SECRET');
  });

  it('should_warn_when_auth_secret_is_default', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.DATABASE_URL = 'postgres://localhost/db';
    process.env.AUTH_SECRET = 'generate-with-openssl-rand-base64-64';
    validateEnv();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('AUTH_SECRET');
  });

  it('should_not_warn_when_auth_secret_is_custom', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.DATABASE_URL = 'postgres://localhost/db';
    process.env.AUTH_SECRET = 'my-custom-secret-value-12345';
    validateEnv();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should_not_error_when_all_vars_present', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.DATABASE_URL = 'postgres://localhost/db';
    process.env.AUTH_SECRET = 'my-custom-secret';
    validateEnv();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
