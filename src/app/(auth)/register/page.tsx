'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    setErrors({});

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || 'Erro ao criar conta');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setApiError('Erro ao criar conta');
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          CRIAR CONTA
        </h1>
        <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
          Crie sua conta para salvar empresas, vagas e acompanhar candidaturas.
        </p>
      </div>

      <div className="card-brutalist" style={{ padding: 32 }}>
        {apiError && (
          <div style={{ border: '2px solid #dc2626', padding: 12, marginBottom: 16, backgroundColor: '#fef2f2' }}>
            <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', margin: 0 }}>{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                border: '4px solid #020617',
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0px #000',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                border: '4px solid #020617',
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0px #000',
                boxSizing: 'border-box',
              }}
            />
            {errors.email && (
              <p style={{ color: '#dc2626', fontSize: '0.65rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0', fontWeight: 700 }}>{errors.email}</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                border: '4px solid #020617',
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0px #000',
                boxSizing: 'border-box',
              }}
            />
            {errors.password && (
              <p style={{ color: '#dc2626', fontSize: '0.65rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0', fontWeight: 700 }}>{errors.password}</p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                border: '4px solid #020617',
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0px #000',
                boxSizing: 'border-box',
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: '#dc2626', fontSize: '0.65rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0', fontWeight: 700 }}>{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon"
            style={{ width: '100%', padding: '14px 24px', fontSize: '0.8rem' }}
          >
            {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#020617', fontWeight: 900, textDecoration: 'none' }}>Entrar</Link>
      </p>
    </div>
  );
}
