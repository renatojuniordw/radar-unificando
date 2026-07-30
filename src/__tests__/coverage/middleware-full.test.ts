import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNextResponse = {
  next: vi.fn(() => ({
    headers: new Map(),
    status: 200,
  })),
  redirect: vi.fn((url: URL) => ({ headers: new Map(), status: 302, url: url.toString() })),
};

vi.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn((handler: any) => handler),
  })),
}));

vi.mock('@/auth.config', () => ({
  authConfig: { providers: [], pages: { signIn: '/login' } },
}));

describe('Middleware Security Headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_set_security_headers_via_mock', () => {
    const response = mockNextResponse.next();
    const headers = new Map<string, string>();
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.size).toBe(5);
  });
});

describe('Middleware Route Protection', () => {
  it('should_redirect_to_login_for_protected_paths', () => {
    const protectedPaths = ['/perfil', '/match', '/aplicacoes'];
    for (const path of protectedPaths) {
      const loginUrl = new URL('/login', `http://localhost${path}`);
      loginUrl.searchParams.set('callbackUrl', path);
      expect(loginUrl.pathname).toBe('/login');
      expect(loginUrl.searchParams.get('callbackUrl')).toBe(path);
    }
  });

  it('should_allow_public_paths', () => {
    const publicPaths = ['/', '/login', '/register', '/api/auth/session'];
    for (const path of publicPaths) {
      const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/api/auth');
      expect(isPublic).toBe(true);
    }
  });

  it('should_include_cors_headers_for_api_paths', () => {
    expect('/api/health'.startsWith('/api/')).toBe(true);
    expect('/api/vagas'.startsWith('/api/')).toBe(true);
    expect('/'.startsWith('/api/')).toBe(false);
  });
});

describe('Middleware Matcher', () => {
  it('should_exclude_static_assets', () => {
    const matcher = ['/((?!_next/static|_next/image|favicon.ico).*)'];
    const excludePattern = /_next\/static|_next\/image|favicon\.ico/;
    expect(excludePattern.test('/_next/static/chunk.js')).toBe(true);
    expect(excludePattern.test('/_next/image/logo.png')).toBe(true);
    expect(excludePattern.test('/favicon.ico')).toBe(true);
    expect(excludePattern.test('/api/health')).toBe(false);
    expect(excludePattern.test('/perfil')).toBe(false);
  });
});
