import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'Radar Unificando <no-reply@radarunificando.com.br>';

// Transport criado sob demanda apenas quando SMTP está configurado.
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_PORT) === '465',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transport;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    // Fallback de desenvolvimento: sem SMTP configurado, loga o link no console.
    console.log(`[PASSWORD_RESET] ${to} ${resetUrl}`);
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

  await getTransport().sendMail({
    from: process.env.MAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  });
}