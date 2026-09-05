import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as EmailService from '@/lib/infrastructure/email/email-service';

const { ResendMock } = vi.hoisted(() => ({
  ResendMock: vi.fn().mockImplementation(function (this: any) {
    this.emails = {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
    };
  }),
}));

vi.mock('resend', () => ({
  Resend: ResendMock,
}));

const DEFAULT_FROM = 'Radar Unificando <no-reply@radarunificando.com.br>';

describe('email-service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MAIL_FROM;
    delete process.env.NEXTAUTH_URL;
    vi.resetModules();
  });

  async function loadService(): Promise<typeof EmailService> {
    return import('@/lib/infrastructure/email/email-service');
  }

  function getSendMock(): ReturnType<typeof vi.fn> {
    const instance = ResendMock.mock.results[0]?.value as
      | { emails: { send: ReturnType<typeof vi.fn> } }
      | undefined;
    if (!instance) {
      throw new Error('Resend client was not instantiated');
    }
    return instance.emails.send;
  }

  describe('sendPasswordResetEmail', () => {
    it('should_warn_and_return_when_resend_api_key_not_configured', async () => {
      delete process.env.RESEND_API_KEY;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset?token=abc');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PASSWORD_RESET] RESEND_API_KEY não configurada'),
      );
    });

    it('should_not_instantiate_resend_client_when_key_is_missing', async () => {
      delete process.env.RESEND_API_KEY;

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset');

      expect(ResendMock).not.toHaveBeenCalled();
    });

    it('should_send_password_reset_email_with_default_from', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset?token=abc');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          from: DEFAULT_FROM,
          to: 'user@test.com',
        }),
      );
    });

    it('should_use_maill_from_env_when_configured_for_password_reset', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.MAIL_FROM = 'Custom <custom@test.com>';

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'Custom <custom@test.com>' }),
      );
    });

    it('should_use_fixed_subject_for_password_reset', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Recuperação de senha — Radar Unificando' }),
      );
    });

    it('should_include_reset_url_in_text_and_html_payload', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      const resetUrl = 'https://app.example/reset?token=secret123';

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', resetUrl);

      const payload = getSendMock().mock.calls[0][0];
      expect(payload.text).toContain(resetUrl);
      expect(payload.html).toContain(resetUrl);
    });

    it('should_throw_when_resend_returns_error', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendPasswordResetEmail } = await loadService();
      // primeira chamada instancia o client (default happy path do mock)
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset');
      getSendMock().mockResolvedValueOnce({ data: null, error: { message: 'rate limited' } });

      await expect(
        sendPasswordResetEmail('user@test.com', 'https://app.example/reset'),
      ).rejects.toThrow('Resend error: rate limited');
    });

    it('should_resolve_without_throwing_when_send_succeeds', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendPasswordResetEmail } = await loadService();

      await expect(
        sendPasswordResetEmail('user@test.com', 'https://app.example/reset'),
      ).resolves.not.toThrow();
    });

    it('should_reuse_singleton_resend_client_across_calls', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendPasswordResetEmail } = await loadService();
      await sendPasswordResetEmail('user@test.com', 'https://app.example/reset');
      await sendPasswordResetEmail('other@test.com', 'https://app.example/reset2');

      expect(ResendMock).toHaveBeenCalledTimes(1);
      expect(ResendMock).toHaveBeenCalledWith('re_test_key');
      expect(getSendMock()).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should_warn_and_return_when_resend_api_key_not_configured', async () => {
      delete process.env.RESEND_API_KEY;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WELCOME_EMAIL] RESEND_API_KEY não configurada'),
      );
      expect(ResendMock).not.toHaveBeenCalled();
    });

    it('should_send_welcome_email_using_first_name_from_full_name', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria Silva');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          from: DEFAULT_FROM,
          to: 'user@test.com',
          subject: 'Bem-vindo(a) ao Radar Unificando, Maria! 🚀',
        }),
      );
      const payload = getSendMock().mock.calls[0][0];
      expect(payload.text).toContain('Olá, Maria!');
      expect(payload.html).toContain('Maria');
    });

    it('should_send_welcome_email_with_single_word_name', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'João');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Bem-vindo(a) ao Radar Unificando, João! 🚀' }),
      );
    });

    it('should_use_candidato_when_name_is_missing', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Bem-vindo(a) ao Radar Unificando, Candidato! 🚀' }),
      );
      const payload = getSendMock().mock.calls[0][0];
      expect(payload.text).toContain('Olá, Candidato!');
    });

    it('should_use_candidato_when_name_is_null', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', null);

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Bem-vindo(a) ao Radar Unificando, Candidato! 🚀' }),
      );
    });

    it('should_log_error_but_not_throw_when_welcome_send_fails', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria');
      getSendMock().mockResolvedValueOnce({ data: null, error: { message: 'bounced' } });

      await expect(sendWelcomeEmail('user@test.com', 'Maria')).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WELCOME_EMAIL] Erro ao enviar e-mail de boas-vindas:',
        'bounced',
      );
    });

    it('should_include_default_login_url_in_welcome_html', async () => {
      process.env.RESEND_API_KEY = 're_test_key';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria');

      const payload = getSendMock().mock.calls[0][0];
      expect(payload.html).toContain('https://radarunificando.com.br/login');
    });

    it('should_use_nexauth_url_env_in_welcome_html_when_configured', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.NEXTAUTH_URL = 'https://custom.example.com';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria');

      const payload = getSendMock().mock.calls[0][0];
      expect(payload.html).toContain('https://custom.example.com/login');
      expect(payload.html).not.toContain('https://radarunificando.com.br/login');
    });

    it('should_use_maill_from_env_when_configured_for_welcome', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.MAIL_FROM = 'Custom <custom@test.com>';

      const { sendWelcomeEmail } = await loadService();
      await sendWelcomeEmail('user@test.com', 'Maria');

      expect(getSendMock()).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'Custom <custom@test.com>' }),
      );
    });
  });
});