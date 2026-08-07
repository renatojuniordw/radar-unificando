import Link from 'next/link';
import Container from '@mui/material/Container';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createExtensionToken } from '@/lib/core/extension/extension-token';
import { CopyTokenButton } from './copy-token-button';

/** Só permite redirecionar para o redirect padrão do launchWebAuthFlow (evita open redirect). */
function isSafeRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'https:' && url.hostname.endsWith('.chromiumapp.org');
  } catch {
    return false;
  }
}

export default async function ConectarExtensaoPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { redirect_uri } = await searchParams;
  const rawToken = await createExtensionToken(session.user.id);

  // Fluxo automático via launchWebAuthFlow: entrega o token no redirect da extensão.
  if (redirect_uri && isSafeRedirectUri(redirect_uri)) {
    const separator = redirect_uri.includes('?') ? '&' : '?';
    redirect(`${redirect_uri}${separator}token=${encodeURIComponent(rawToken)}`);
  }

  // Fallback manual: mostra o token para copiar e colar na extensão.
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Link
        href="/extensao"
        style={{
          color: '#64748b',
          fontSize: '0.75rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textDecoration: 'none',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        ← VOLTAR À EXTENSÃO
      </Link>

      <div className="badge-neon" style={{ margin: '24px 0 16px', display: 'inline-block' }}>
        CONEXÃO
      </div>
      <h1
        style={{
          fontWeight: 900,
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          textTransform: 'uppercase',
          color: '#020617',
          marginBottom: '12px',
          lineHeight: 0.95,
        }}
      >
        Conectar extensão
      </h1>
      <p style={{ color: '#475569', fontSize: '0.9rem', maxWidth: '560px', marginBottom: '24px' }}>
        Copie o token abaixo e cole na extensão para conectar sua conta. O token
        é gerado na hora e fica salvo no seu navegador.
      </p>

      <div className="card-brutalist" style={{ padding: '20px', marginBottom: '20px' }}>
        <div
          style={{
            color: '#64748b',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Seu token de extensão
        </div>
        <div
          style={{
            wordBreak: 'break-all',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.8rem',
            color: '#020617',
          }}
        >
          {rawToken}
        </div>
      </div>

      <CopyTokenButton token={rawToken} />
    </Container>
  );
}