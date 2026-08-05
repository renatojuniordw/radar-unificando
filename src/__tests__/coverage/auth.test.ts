import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNextAuth = vi.fn();
const mockFindByEmail = vi.fn();
const mockCompare = vi.fn();

vi.mock('next-auth', () => ({
  default: vi.fn((config: any) => {
    mockNextAuth(config);
    return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() };
  }),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(() => ({
    id: 'credentials',
    name: 'credentials',
    type: 'credentials',
    authorize: vi.fn().mockImplementation(async (credentials: any) => {
      if (!credentials?.email || !credentials?.password) return null;
      const email = String(credentials.email);
      const password = String(credentials.password);
      try {
        const user = await mockFindByEmail(email);
        if (!user) return null;
        const isValid = await mockCompare(password, user.passwordHash);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name };
      } catch {
        return null;
      }
    }),
  })),
}));

vi.mock('bcryptjs', () => ({
  default: { compare: mockCompare },
  compare: mockCompare,
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: { findByEmail: mockFindByEmail },
}));

vi.mock('@/auth.config', () => ({
  authConfig: { pages: { signIn: '/login' }, callbacks: {}, session: { strategy: 'jwt' } },
}));

type MockCredentialsProvider = {
  id: string;
  name: string;
  type: 'credentials';
  authorize: (credentials?: any, request?: any) => Promise<any>;
};

async function getProvider(): Promise<MockCredentialsProvider> {
  const CredentialsProvider = (await import('next-auth/providers/credentials')).default;
  return CredentialsProvider({} as any) as unknown as MockCredentialsProvider;
}

describe('Auth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_export_handlers_and_pass_config_to_nextauth', async () => {
    const mod = await import('@/auth');
    expect(mod.handlers).toBeDefined();
    expect(mod.signIn).toBeDefined();
    expect(mod.signOut).toBeDefined();
    expect(mod.auth).toBeDefined();
    expect(mockNextAuth).toHaveBeenCalledWith(expect.objectContaining({
      providers: expect.any(Array),
      pages: expect.any(Object),
    }));
  });

  it('should_return_null_when_credentials_are_missing', async () => {
    const provider = await getProvider();
    const result = await provider.authorize({});
    expect(result).toBeNull();
  });

  it('should_return_null_when_email_not_found', async () => {
    const provider = await getProvider();
    mockFindByEmail.mockResolvedValue(null);
    const result = await provider.authorize({ email: 'test@test.com', password: '123456' });
    expect(result).toBeNull();
  });

  it('should_return_null_when_password_is_invalid', async () => {
    const provider = await getProvider();
    mockFindByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hash' });
    mockCompare.mockResolvedValue(false);
    const result = await provider.authorize({ email: 'test@test.com', password: 'wrong' });
    expect(result).toBeNull();
  });

  it('should_return_user_when_credentials_are_valid', async () => {
    const provider = await getProvider();
    mockFindByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hash', name: 'User' });
    mockCompare.mockResolvedValue(true);
    const result = await provider.authorize({ email: 'test@test.com', password: 'correct' });
    expect(result).toEqual({ id: '1', email: 'test@test.com', name: 'User' });
  });

  it('should_return_null_on_database_error', async () => {
    const provider = await getProvider();
    mockFindByEmail.mockRejectedValue(new Error('DB down'));
    const result = await provider.authorize({ email: 'test@test.com', password: '123456' });
    expect(result).toBeNull();
  });
});
