import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/rate-limit';
import { authConfig } from './auth.config';

class RateLimitedError extends CredentialsSignin {
  code = 'RATE_LIMITED';
}

function getClientIp(request?: { headers?: Headers }): string {
  const headers = request?.headers;
  const fwd = headers?.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers?.get('x-real-ip') || '127.0.0.1';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email);
        const password = String(credentials.password);

        // Rate limit de login: 5 tentativas/min por IP+email (anti brute force)
        const ip = getClientIp(request);
        const { success, msBeforeNext } = await checkRateLimit(`${ip}:${email}`, 'auth');
        if (!success) {
          console.warn(`[auth] Login rate limit atingido para ${email} (retry em ${Math.ceil(msBeforeNext / 1000)}s)`);
          throw new RateLimitedError();
        }

        try {
          const user = await userRepository.findByEmail(email);
          if (!user) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
