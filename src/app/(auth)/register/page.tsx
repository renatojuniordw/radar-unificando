'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerFormSchema } from '@/lib/core/auth/register-schema';
import { FormField } from '@/components/ui/form-field';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { zodFieldErrors } from '@/lib/utils/form-errors';
import { Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';

const registerSchema = registerFormSchema;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
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
        const data = await res.json().catch(() => null);
        setApiError(data?.error || 'Erro ao criar conta');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setApiError('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
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
          <UserPlus size={14} />
          <span>NOVO USUÁRIO</span>
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
          CRIAR CONTA
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
          Cadastre-se para salvar vagas, empresas e acelerar sua busca por trabalho remoto.
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
            label="Nome Completo"
            type="text"
            placeholder="Ex: Maria Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="seu.email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={errors.email}
          />

          {/* Password Input with Toggle */}
          <div style={{ position: 'relative' }}>
            <FormField
              label="Senha"
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

          {/* Real-time Password Strength Meter */}
          <PasswordStrengthMeter
            password={password}
            confirmPassword={confirmPassword}
            showMatchStatus={true}
          />

          {/* Confirm Password Input with Toggle */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <FormField
              label="Confirmar Senha"
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
            <span>{loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      {/* Bottom Login Link Callout */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 18,
          padding: '12px 16px',
          border: '3px solid #020617',
          backgroundColor: '#ffffff',
          boxShadow: '4px 4px 0px #000',
        }}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            color: '#475569',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Já possui uma conta?{' '}
        </span>
        <Link
          href="/login"
          style={{
            color: '#020617',
            fontWeight: 900,
            textDecoration: 'underline',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          ENTRAR AGORA
        </Link>
      </div>
    </div>
  );
}
