export function validateEnv(): void {
  const required = ['DATABASE_URL', 'AUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias: ${missing.join(', ')}. ` +
      `Copie .env.example para .env e preencha os valores.`
    );
  }

  if (process.env.AUTH_SECRET === 'generate-with-openssl-rand-base64-64') {
    console.warn('[SECURITY] AUTH_SECRET está com valor padrão. Gere um valor seguro com: openssl rand -base64 64');
  }
}
