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

export async function sendWelcomeEmail(to: string, name?: string | null): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[WELCOME_EMAIL] RESEND_API_KEY não configurada — e-mail de boas-vindas NÃO enviado.');
    return;
  }

  const firstName = name ? name.split(' ')[0] : 'Candidato';
  const subject = `Bem-vindo(a) ao Radar Unificando, ${firstName}! 🚀`;

  const text = [
    `Olá, ${firstName}!`,
    '',
    'Sua conta no Radar Unificando foi criada com sucesso!',
    '',
    'Confira os 3 passos para acelerar sua conquista de vagas remotas:',
    '1. Cadastre seu Currículo Base: Acesse a aba Perfil e importe seu PDF ou LinkedIn para a IA mapear suas competências.',
    '2. Busque Vagas Remotas: Filtre vagas por área, nível de senioridade e tecnologias.',
    '3. Confeccione Currículos Sob Medida: Na Análise ATS, gere em segundos currículos adaptados em PDF e Word (DOCX).',
    '',
    'Bons estudos e boa sorte nas candidaturas!',
    'Equipe Radar Unificando',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #020617;">
      <div style="background-color: #020617; color: #ccff00; padding: 16px 20px; border-radius: 8px 8px 0 0; font-weight: 900; text-transform: uppercase;">
        ⚡ Radar Unificando — Boas-Vindas
      </div>
      <div style="padding: 24px; border: 2px solid #020617; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #020617;">Olá, ${firstName}! 🎉</h2>
        <p style="color: #334155; line-height: 1.5;">Sua conta no <strong>Radar Unificando</strong> foi criada com sucesso! Estamos prontos para te ajudar a encontrar as melhores oportunidades remotas e passar nos filtros ATS.</p>

        <h3 style="color: #020617; margin-top: 20px; text-transform: uppercase; font-size: 0.9rem;">📌 3 Passos Essenciais para Começar:</h3>
        <ol style="color: #334155; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 8px;"><strong>Importe seu Currículo Base:</strong> Acesse seu <strong>Perfil</strong> e suba seu PDF/LinkedIn para a IA identificar suas habilidades principais.</li>
          <li style="margin-bottom: 8px;"><strong>Filtre Vagas Remotas:</strong> Pesquise por cargo, nível e tecnologias na página de <strong>Busca</strong>.</li>
          <li><strong>Gere Currículos em PDF e Word:</strong> Na <strong>Análise ATS</strong> de qualquer vaga, confeccione currículos totalmente sob medida em segundos!</li>
        </ol>

        <div style="margin: 28px 0 12px; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'https://radarunificando.com.br'}/login" style="background:#ccff00;color:#020617;padding:12px 24px;border:2px solid #020617;box-shadow:3px 3px 0px #000;text-decoration:none;font-weight:900;text-transform:uppercase;font-size:14px;display:inline-block;">
            Acessar Minha Conta
          </a>
        </div>
      </div>
    </div>
  `;

  const { error } = await getClient().emails.send({
    from: process.env.MAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error('[WELCOME_EMAIL] Erro ao enviar e-mail de boas-vindas:', error.message);
  }
}