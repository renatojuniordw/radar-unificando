'use client';

import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  showMatchStatus?: boolean;
}

export function PasswordStrengthMeter({
  password,
  confirmPassword = '',
  showMatchStatus = false,
}: PasswordStrengthMeterProps) {
  const criteria = [
    { label: 'Pelo menos 8 caracteres', met: password.length >= 8 },
    { label: 'Uma letra maiúscula (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Uma letra minúscula (a-z)', met: /[a-z]/.test(password) },
    { label: 'Pelo menos um número (0-9)', met: /[0-9]/.test(password) },
    { label: 'Um caractere especial (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  const getScoreInfo = () => {
    if (!password) return { label: 'DIGITE UMA SENHA', color: '#64748b', percent: 0 };
    if (metCount <= 2) return { label: 'SENHA FRACA', color: '#dc2626', percent: 33 };
    if (metCount <= 4) return { label: 'SENHA MÉDIA', color: '#d97706', percent: 66 };
    return { label: 'SENHA FORTE', color: '#16a34a', percent: 100 };
  };

  const scoreInfo = getScoreInfo();
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '2px solid #020617',
        boxShadow: '3px 3px 0px #000',
        padding: '12px 14px',
        marginBottom: 18,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      {/* Strength Bar Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: '#020617',
            textTransform: 'uppercase',
          }}
        >
          FORÇA DA SENHA
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: scoreInfo.color,
          }}
        >
          {scoreInfo.label}
        </span>
      </div>

      {/* Visual Bar Indicator */}
      <div
        style={{
          height: 6,
          width: '100%',
          backgroundColor: '#e2e8f0',
          border: '1px solid #020617',
          marginBottom: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${scoreInfo.percent}%`,
            backgroundColor: scoreInfo.color,
            transition: 'width 0.25s ease, background-color 0.25s ease',
          }}
        />
      </div>

      {/* Requirements Checklist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {criteria.map((c, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.68rem',
              color: c.met ? '#020617' : '#64748b',
              transition: 'color 0.15s ease',
            }}
          >
            {c.met ? (
              <Check size={13} style={{ color: '#16a34a', flexShrink: 0, strokeWidth: 3 }} />
            ) : (
              <X size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: c.met ? 800 : 500 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Match Indicator */}
      {showMatchStatus && confirmPassword.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.68rem',
            fontWeight: 800,
            color: passwordsMatch ? '#16a34a' : '#dc2626',
          }}
        >
          {passwordsMatch ? (
            <>
              <Check size={13} style={{ color: '#16a34a', flexShrink: 0, strokeWidth: 3 }} />
              <span>SENHAS COINCIDEM</span>
            </>
          ) : passwordsMismatch ? (
            <>
              <X size={13} style={{ color: '#dc2626', flexShrink: 0, strokeWidth: 3 }} />
              <span>SENHAS NÃO COINCIDEM</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
