'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { FormField } from '@/components/ui/form-field';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { zodFieldErrors } from '@/lib/utils/form-errors';
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Precisa ter letra maiúscula (A-Z)')
      .regex(/[a-z]/, 'Precisa ter letra minúscula (a-z)')
      .regex(/[0-9]/, 'Precisa ter número (0-9)')
      .regex(/[^A-Za-z0-9]/, 'Precisa ter caractere especial (!@#$...)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    setErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setApiError(data?.error || 'Erro ao redefinir a senha');
        return;
      }

      router.push('/login?reset=true');
    } catch {
      setApiError('Erro ao redefinir a senha');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card-brutalist" style={{ padding: 24, textAlign: 'center' }}>
        <ShieldCheck size={32} color="#dc2626" style={{ marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 900, color: '#dc2626' }}>
          LINK INVÁLIDO
        </h2>
        <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 16px' }}>
          O link de recuperação está incompleto ou expirado.
        </p>
        <Link
          href="/forgot-password"
          className="btn-neon"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            fontSize: '0.8rem',
            fontWeight: 900,
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          SOLICITAR NOVO LINK
        </Link>
      </div>
    );
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
            backgroundColor: '#ccff00',
            color: '#020617',
            border: '2px solid #020617',
            boxShadow: '3px 3px 0px #000',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 900,
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <KeyRound size={14} />
          <span>NOVA SENHA</span>
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
          REDEFINIR SENHA
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
          Defina uma nova senha para a sua conta.
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
          <div style={{ position: 'relative' }}>
            <FormField
              label="Nova Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={errors.password}
              marginBottom={10}
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

          <PasswordStrengthMeter
            password={password}
            confirmPassword={confirmPassword}
            showMatchStatus={true}
          />

          <div style={{ position: 'relative', marginBottom: 20 }}>
            <FormField
              label="Confirmar Nova Senha"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={errors.confirmPassword}
              marginBottom={0}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
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
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            <span>{loading ? 'SALVANDO...' : 'REDEFINIR SENHA'}</span>
            {!loading && <ShieldCheck size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}