import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  default: vi.fn().mockReturnValue({
    auth: vi.fn().mockImplementation((handler: any) => handler),
  }),
}));

vi.mock('@/auth.config', () => ({
  authConfig: { providers: [], pages: { signIn: '/login' } },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ headers: new Headers(), status: 200 })),
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers(),
    })),
    redirect: vi.fn((url: URL) => ({
      url: url.toString(),
      status: 302,
      headers: new Headers(),
    })),
  },
  NextRequest: class {},
}));

import proxyHandler, { config as middlewareConfig } from '@/proxy';
import { NextResponse } from 'next/server';

type ReqOverrides = {
  path: string;
  method?: string;
  origin?: string;
  referer?: string;
  host?: string;
  forwardedHost?: string;
  forwardedProto?: string;
  auth?: unknown;
};

function makeReq({
  path,
  method = 'GET',
  origin,
  referer,
  host,
  forwardedHost,
  forwardedProto,
  auth,
}: ReqOverrides) {
  const headers = new Map<string, string>();
  if (origin) headers.set('origin', origin);
  if (referer) headers.set('referer', referer);
  if (host) headers.set('host', host);
  if (forwardedHost) headers.set('x-forwarded-host', forwardedHost);
  if (forwardedProto) headers.set('x-forwarded-proto', forwardedProto);
  return {
    nextUrl: new URL(`http://localhost${path}`),
    headers: { get: (k: string) => headers.get(k) ?? null },
    method,
    auth,
    url: `http://localhost${path}`,
  };
}

// O wrapper `auth()` do next-auth tipa o handler com `void | Response`; o teste
// mocka o next-auth e o next/server, então o retorno real é o objeto mockado.
const middleware = proxyHandler as unknown as (
  req: ReturnType<typeof makeReq>,
) => Promise<{ headers: Headers; status: number; body?: unknown; url?: string }>;

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.EXTENSION_ORIGIN;
  });

  it('should_set_all_security_headers_on_every_request', async () => {
    const res = await middleware(makeReq({ path: '/' }));
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      expect((res.headers as Headers).get(key)).toBe(value);
    }
  });

  it('should_return_response_for_public_paths_without_authentication', async () => {
    for (const path of ['/', '/login', '/register', '/forgot-password', '/reset-password', '/api/auth/session']) {
      const res = await middleware(makeReq({ path }));
      expect(res.status).toBe(200);
    }
  });

  it('should_redirect_unauthenticated_user_from_protected_path_to_login_with_callback', async () => {
    const res = await middleware(makeReq({ path: '/perfil' }));
    expect(res.status).toBe(302);
    expect(res.url).toContain('/login');
    expect(res.url).toContain(encodeURIComponent('/perfil'));
  });

  it('should_allow_authenticated_user_on_protected_path', async () => {
    const res = await middleware(makeReq({ path: '/perfil', auth: { user: { id: '1' } } }));
    expect(res.status).toBe(200);
  });

  it('should_set_cors_headers_for_same_origin_api_request', async () => {
    const res = await middleware(makeReq({ path: '/api/health', origin: 'http://localhost' }));
    const headers = res.headers as Headers;
    expect(headers.get('Access-Control-Allow-Origin')).toBe('http://localhost');
    expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('should_allow_api_request_with_origin_from_forwarded_host', async () => {
    const res = await middleware(
      makeReq({ path: '/api/health', origin: 'http://api.example.com', forwardedHost: 'api.example.com' }),
    );
    expect((res.headers as Headers).get('Access-Control-Allow-Origin')).toBe('http://api.example.com');
  });

  it('should_allow_api_request_with_origin_from_auth_url_env', async () => {
    process.env.AUTH_URL = 'https://app.radar.com';
    const res = await middleware(makeReq({ path: '/api/health', origin: 'https://app.radar.com' }));
    expect((res.headers as Headers).get('Access-Control-Allow-Origin')).toBe('https://app.radar.com');
  });

  it('should_allow_api_request_with_origin_from_extension_origin_env', async () => {
    process.env.EXTENSION_ORIGIN = 'chrome-extension://abcdef';
    const res = await middleware(makeReq({ path: '/api/health', origin: 'chrome-extension://abcdef' }));
    expect((res.headers as Headers).get('Access-Control-Allow-Origin')).toBe('chrome-extension://abcdef');
  });

  it('should_ignore_invalid_auth_and_nextauth_url_envs_without_crashing', async () => {
    process.env.AUTH_URL = 'not-a-url';
    process.env.NEXTAUTH_URL = 'also-not-a-url';
    const res = await middleware(
      makeReq({ path: '/api/health', origin: 'http://evil.example.com' }),
    );
    expect(res.status).toBe(200);
    expect((res.headers as Headers).get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should_not_echo_cors_origin_for_unlisted_origin', async () => {
    const res = await middleware(makeReq({ path: '/api/health', origin: 'http://evil.example.com' }));
    expect((res.headers as Headers).get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should_return_204_for_same_origin_options_preflight', async () => {
    const res = await middleware(makeReq({ path: '/api/health', method: 'OPTIONS', origin: 'http://localhost' }));
    expect(res.status).toBe(204);
  });

  it('should_return_403_for_cross_origin_options_preflight', async () => {
    const res = await middleware(
      makeReq({ path: '/api/health', method: 'OPTIONS', origin: 'http://evil.example.com' }),
    );
    expect(res.status).toBe(403);
  });

  it('should_reject_cross_origin_mutating_request_with_403', async () => {
    const res = await middleware(
      makeReq({ path: '/api/vagas', method: 'POST', origin: 'http://evil.example.com' }),
    );
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Origem não permitida' });
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Origem não permitida' }, { status: 403 });
  });

  it('should_allow_cross_origin_mutating_request_to_auth_routes', async () => {
    const res = await middleware(
      makeReq({ path: '/api/auth/register', method: 'POST', origin: 'http://evil.example.com' }),
    );
    expect(res.status).toBe(200);
  });

  it('should_allow_cross_origin_mutating_request_to_extension_routes', async () => {
    const res = await middleware(
      makeReq({ path: '/api/extension/analyze', method: 'POST', origin: 'http://evil.example.com' }),
    );
    expect(res.status).toBe(200);
  });

  it('should_allow_mutating_request_without_origin_or_referer', async () => {
    const res = await middleware(makeReq({ path: '/api/vagas', method: 'POST' }));
    expect(res.status).toBe(200);
  });

  it('should_derive_request_origin_from_referer_when_origin_missing', async () => {
    const allowed = await middleware(
      makeReq({ path: '/api/vagas', method: 'POST', referer: 'http://localhost/pagina' }),
    );
    expect(allowed.status).toBe(200);

    const denied = await middleware(
      makeReq({ path: '/api/vagas', method: 'POST', referer: 'http://evil.example.com/pagina' }),
    );
    expect(denied.status).toBe(403);
  });

  it('should_treat_malformed_referer_as_same_origin', async () => {
    const res = await middleware(makeReq({ path: '/api/vagas', method: 'POST', referer: 'not-a-url' }));
    expect(res.status).toBe(200);
  });

  it('should_allow_get_requests_from_cross_origin', async () => {
    const res = await middleware(makeReq({ path: '/api/vagas', origin: 'http://evil.example.com' }));
    expect(res.status).toBe(200);
  });

  it('should_match_api_and_public_routes_on_matcher_config', async () => {
    // O config do middleware cobre tudo exceto _next/static, _next/image e favicon.
    expect(middlewareConfig.matcher[0]).toBe('/((?!_next/static|_next/image|favicon.ico).*)');
  });
});
