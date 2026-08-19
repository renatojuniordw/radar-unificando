import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendPasswordResetEmail } from '@/lib/infrastructure/email/email-service';

const TO = 'user@example.com';
const RESET_URL = 'http://localhost:11010/reset-password?token=abc123';
const DEFAULT_FROM = 'Radar Unificando <no-reply@radarunificando.com.br>';
const ENV_KEYS = ['RESEND_API_KEY', 'MAIL_FROM'] as const;

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ENV_KEYS.forEach((key) => delete process.env[key]);
  });

  afterEach(() => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
  });

  it('should_warn_without_exposing_token_when_no_api_key', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await sendPasswordResetEmail(TO, RESET_URL);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESEND_API_KEY não configurada'),
    );
    expect(warnSpy.mock.calls[0][0]).not.toContain(RESET_URL);
    expect(warnSpy.mock.calls[0][0]).not.toContain(TO);
    expect(sendMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should_send_email_with_correct_payload', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.MAIL_FROM = DEFAULT_FROM;
    sendMock.mockResolvedValueOnce({ data: { id: 'email-1' }, error: null });

    await sendPasswordResetEmail(TO, RESET_URL);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe(TO);
    expect(payload.from).toBe(DEFAULT_FROM);
    expect(payload.subject).toContain('Recuperação de senha');
    expect(payload.text).toContain(RESET_URL);
    expect(payload.html).toContain(RESET_URL);
  });

  it('should_use_default_from_when_mail_from_not_set', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockResolvedValueOnce({ data: { id: 'email-1' }, error: null });

    await sendPasswordResetEmail(TO, RESET_URL);

    expect(sendMock.mock.calls[0][0].from).toBe(DEFAULT_FROM);
  });

  it('should_throw_when_resend_returns_error', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'domain not verified' } });

    await expect(sendPasswordResetEmail(TO, RESET_URL)).rejects.toThrow(
      'Resend error: domain not verified'
    );
  });
});
