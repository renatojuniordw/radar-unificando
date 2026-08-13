import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default auth((req) => {
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  const path = req.nextUrl.pathname;

  // CORS for API routes — only our own origin is ever allowed, never reflected back
  if (path.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const selfOrigin = req.nextUrl.origin;
    let requestOrigin = origin;
    if (!requestOrigin && referer) {
      try { requestOrigin = new URL(referer).origin; } catch { /* malformed referer */ }
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const forwardedOrigin = host ? `${proto}://${host}` : null;

    const allowedOrigins = new Set<string>();
    allowedOrigins.add(selfOrigin);
    if (forwardedOrigin) allowedOrigins.add(forwardedOrigin);
    if (host) {
      allowedOrigins.add(`http://${host}`);
      allowedOrigins.add(`https://${host}`);
    }
    if (process.env.AUTH_URL) {
      try { allowedOrigins.add(new URL(process.env.AUTH_URL).origin); } catch {}
    }
    if (process.env.NEXTAUTH_URL) {
      try { allowedOrigins.add(new URL(process.env.NEXTAUTH_URL).origin); } catch {}
    }
    // Origem fixa da extensão Chrome (ex.: chrome-extension://<id>). Nunca refletida.
    if (process.env.EXTENSION_ORIGIN) {
      allowedOrigins.add(process.env.EXTENSION_ORIGIN);
    }

    const sameOrigin = requestOrigin ? allowedOrigins.has(requestOrigin) : true;

    if (origin && allowedOrigins.has(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: sameOrigin ? 204 : 403, headers: response.headers });
    }

    // Reject state-changing requests that don't carry a matching Origin/Referer —
    // blocks other sites, scripts, and direct HTTP clients from driving this API.
    // /api/extension/* is exempt: it authenticates via `Authorization: Bearer <token>`
    // only (no session cookie), so it isn't CSRF-able the way cookie-auth routes are —
    // a page can't forge that header without already holding the token. This also
    // avoids depending on EXTENSION_ORIGIN matching the exact chrome-extension:// id,
    // which differs per machine/build for an unpacked extension.
    const isMutating = !['GET', 'HEAD'].includes(req.method);
    if (isMutating && !sameOrigin && !path.startsWith('/api/auth') && !path.startsWith('/api/extension')) {
      return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 });
    }
  }

  // Protect dashboard routes
  const protectedPaths = ['/perfil'];
  if (protectedPaths.some(p => path.startsWith(p)) && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Public routes that don't require auth
  if (path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/api/auth')) {
    return response;
  }

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
