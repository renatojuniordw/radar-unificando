'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

interface CheckItem {
  label: string;
  done: boolean;
}

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  checks: CheckItem[];
}

export function ProfileCompletionCard({ percent, completedCount, totalCount, checks }: Props) {
  return (
    <div
      className="card-brutalist"
      style={{
        padding: '24px',
        marginBottom: '24px',
        border: '4px solid #020617',
        backgroundColor: '#ffffff',
        boxShadow: '8px 8px 0px #000',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{
          fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase',
          fontFamily: 'ui-monospace, monospace', color: '#020617', letterSpacing: '0.05em',
        }}>
          PERFIL COMPLETO
        </span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', color: '#64748b',
          textTransform: 'uppercase', fontWeight: 700,
        }}>
          {completedCount}/{totalCount} ITENS
        </span>
      </div>

      {/* Barra de Progresso */}
      <div style={{ height: '8px', background: '#e2e8f0', border: '2px solid #020617', marginBottom: '16px' }}>
        <div style={{
          height: '100%', width: `${percent}%`,
          backgroundColor: '#00ff66',
          transition: 'width 0.3s ease-out',
        }} />
      </div>

      {/* Checklist */}
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '8px 16px',
      }}>
        {checks.map((c) => (
          <li key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {c.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 shrink-0 stroke-[2]" />
            )}
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 800,
              color: c.done ? '#020617' : '#94a3b8',
            }}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}