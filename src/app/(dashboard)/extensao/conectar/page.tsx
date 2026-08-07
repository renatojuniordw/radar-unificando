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
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase', color: '#020617' }}>
        Conectar extensão
      </h1>
      <p style={{ color: '#475569', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
        Copie o token abaixo e cole na extensão para conectar sua conta.
      </p>
      <div
        style={{
          border: '2px solid #020617',
          backgroundColor: '#f8fafc',
          padding: 16,
          margin: '16px 0',
          wordBreak: 'break-all',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.8rem',
        }}
      >
        {rawToken}
      </div>
      <CopyTokenButton token={rawToken} />
    </div>
  );
}