'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { FormField } from '@/components/form-field';
import { zodFieldErrors } from '@/lib/form-errors';
import { Eye, EyeOff, LogIn, UserPlus, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      {/* Header section */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#020617',
            color: '#ccff00',
            border: '2px solid #020617',
            boxShadow: '3px 3px 0px #ccff00',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <LogIn size={14} />
          <span>AUTENTICAÇÃO</span>
        </div>
        <h1
          style={{
            fontWeight: 900,
            fontSize: '2.2rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            margin: '0 0 6px',
            color: '#020617',
          }}
        >
          ENTRAR
        </h1>
        <p
          style={{
            color: '#475569',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Acesse sua conta para utilizar o Radar Unificando.
        </p>
      </div>

      {/* Main Card */}
      <div className="card-brutalist" style={{ padding: 24 }}>
        {apiError && (
          <div
            style={{
              border: '2px solid #dc2626',
              padding: 10,
              marginBottom: 16,
              backgroundColor: '#fef2f2',
            }}
          >
            <p
              style={{
                color: '#dc2626',
                fontWeight: 800,
                fontSize: '0.75rem',
                fontFamily: 'ui-monospace, monospace',
                margin: 0,
              }}
            >
              ⚠️ {apiError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            placeholder="seu.email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={errors.email}
          />

          <div style={{ position: 'relative', marginBottom: 20 }}>
            <FormField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              error={errors.password}
              marginBottom={0}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              style={{
                position: 'absolute',
                right: 10,
                top: 28,
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{loading ? 'ENTRANDO...' : 'ENTRAR'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      {/* Prominent Callout Card for Registration */}
      <div
        style={{
          marginTop: 18,
          padding: '16px 18px',
          border: '3px solid #020617',
          backgroundColor: '#ffffff',
          boxShadow: '4px 4px 0px #000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          textAlign: 'center',
        }}
      >
        <div>
          <h3
            style={{
              fontWeight: 900,
              fontSize: '0.85rem',
              color: '#020617',
              margin: '0 0 2px',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            AINDA NÃO TEM UMA CONTA?
          </h3>
          <p
            style={{
              color: '#475569',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.7rem',
              margin: 0,
            }}
          >
            Crie sua conta gratuitamente em menos de 1 minuto.
          </p>
        </div>

        <Link
          href="/register"
          style={{
            backgroundColor: '#ccff00',
            color: '#020617',
            border: '2px solid #020617',
            fontWeight: 900,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '10px 18px',
            textDecoration: 'none',
            fontFamily: 'ui-monospace, monospace',
            boxShadow: '3px 3px 0px #000',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <UserPlus size={16} />
          <span>CRIAR MINHA CONTA GRÁTIS</span>
        </Link>
      </div>
    </div>
  );
}
