import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

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

  // CORS for API routes
  if (path.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    response.headers.set('Access-Control-Allow-Origin', origin || `http://${host}`);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: response.headers });
    }
  }

  // Protect dashboard routes
  if (path.startsWith('/dashboard') && !req.auth) {
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
