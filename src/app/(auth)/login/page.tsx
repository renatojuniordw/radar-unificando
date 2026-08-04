'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { FormField } from '@/components/form-field';
import { zodFieldErrors } from '@/lib/form-errors';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setApiError('Email ou senha inválidos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setApiError('Erro ao fazer login');
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          ENTRAR
        </h1>
        <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
          Acesse sua conta para usar todos os recursos da plataforma.
        </p>
      </div>

      <div className="card-brutalist" style={{ padding: 32 }}>
        {apiError && (
          <div style={{ border: '2px solid #dc2626', padding: 12, marginBottom: 16, backgroundColor: '#fef2f2' }}>
            <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', margin: 0 }}>{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            error={errors.email}
          />

          <FormField
            label="Senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            error={errors.password}
            marginBottom={24}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-neon"
            style={{ width: '100%', padding: '14px 24px', fontSize: '0.8rem' }}
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Não tem conta?{' '}
        <Link href="/register" style={{ color: '#020617', fontWeight: 900, textDecoration: 'none' }}>Cadastre-se</Link>
      </p>
    </div>
  );
}
