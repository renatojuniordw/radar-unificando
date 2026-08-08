import { LoginForm } from './login-form';

/** Só permite redirecionar para um caminho relativo interno (evita open redirect). */
function isSafeCallbackUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = callbackUrl && isSafeCallbackUrl(callbackUrl) ? callbackUrl : '/';

  return <LoginForm callbackUrl={safeCallbackUrl} />;
}
