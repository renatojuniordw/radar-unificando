import { Resend } from 'resend';

const DEFAULT_FROM = 'Radar Unificando <no-reply@radarunificando.com.br>';

// Client criado sob demanda apenas quando RESEND_API_KEY está configurada.
let resend: Resend | null = null;

function getClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Fallback de desenvolvimento: sem chave configurada, loga aviso sem expor o token.
    console.warn('[PASSWORD_RESET] RESEND_API_KEY não configurada — email de reset NÃO enviado. Configure a env var em produção.');
    return;
  }

  const subject = 'Recuperação de senha — Radar Unificando';
  const text = [
    'Você solicitou a recuperação da sua senha.',
    '',
    `Acesse o link abaixo para definir uma nova senha (válido por 1 hora):`,
    '',
    resetUrl,
    '',
    'Se você não solicitou esta alteração, ignore este e-mail.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #020617;">Recuperação de senha</h2>
      <p>Você solicitou a recuperação da sua senha. Clique no botão abaixo para criar uma nova senha (válido por 1 hora):</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#020617;color:#ccff00;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Redefinir senha
        </a>
      </p>
      <p style="font-size:12px;color:#64748b;">Se você não solicitou esta alteração, ignore este e-mail.</p>
    </div>
  `;

  const { error } = await getClient().emails.send({
    from: process.env.MAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  });

  // O SDK da Resend não lança em erro de API — retorna { data, error }.
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}