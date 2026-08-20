import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWelcomeEmail } from '@/lib/infrastructure/email/email-service';

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(function (this: any) {
      this.emails = {
        send: vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
      };
    }),
  };
});

describe('email-service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('should_warn_and_return_when_resend_api_key_not_configured', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await sendWelcomeEmail('user@test.com', 'Maria');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WELCOME_EMAIL] RESEND_API_KEY não configurada'),
    );
  });

  it('should_send_welcome_email_when_api_key_is_configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    await expect(sendWelcomeEmail('user@test.com', 'Maria Silva')).resolves.not.toThrow();
  });
});
